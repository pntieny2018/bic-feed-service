import { ORDER } from '@beincom/constants';
import { CACHE_KEYS, CRON_RUN_SCHEDULED_CONTENT } from '@libs/common/constants';
import { IPaginatedInfo } from '@libs/database/postgres/common';
import { DistributedLockService } from '@libs/infra/distributed-locks';
import { SentryService } from '@libs/infra/sentry';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { isBoolean } from 'class-validator';
import moment from 'moment';

import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  GetScheduledContentProps,
  IContentDomainService,
} from '../../domain/domain-service/interface';
import { IQueueAdapter, QUEUE_ADAPTER } from '../../domain/infra-adapter-interface';

@Injectable()
export class ContentCron {
  private readonly _logger = new Logger(ContentCron.name);

  private readonly LIMIT_DEFAULT = 100;

  public constructor(
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService,
    @Inject(QUEUE_ADAPTER)
    private readonly _queueAdapter: IQueueAdapter,
    private readonly _sentryService: SentryService,
    private readonly _distributedLockService: DistributedLockService
  ) {}

  @Cron(CRON_RUN_SCHEDULED_CONTENT)
  public async handleJobScheduledContent(): Promise<void> {
    this._logger.debug('[Cron Job] Scheduled Content');

    const bufferTimeInMinute = 1;
    const beforeDate = moment().add(bufferTimeInMinute, 'minute').toDate();

    const resource = CACHE_KEYS.IS_RUNNING_CONTENT_SCHEDULE;
    const ttl = 5000;
    const lock = await this._distributedLockService.applyLock(resource, ttl);

    try {
      const payload: GetScheduledContentProps = {
        limit: this.LIMIT_DEFAULT,
        order: ORDER.DESC,
        beforeDate,
      };
      return this._recursivelyHandleScheduledContent(payload);
    } catch (err) {
      await this._distributedLockService.releaseLock(resource, lock);
      this._logger.error(JSON.stringify(err?.stack));
      this._sentryService.captureException(err);
    }
  }

  private async _recursivelyHandleScheduledContent(
    payload: GetScheduledContentProps,
    metadata?: IPaginatedInfo
  ): Promise<void> {
    const { hasNextPage, endCursor } = metadata || {};

    if (isBoolean(hasNextPage) && hasNextPage === false) {
      return;
    }

    const { rows, meta } = await this._contentDomainService.getScheduledContent({
      ...payload,
      after: endCursor,
    });

    if (!rows || rows.length === 0) {
      return;
    }

    await this._queueAdapter.addContentScheduledJobs(rows);

    await this._recursivelyHandleScheduledContent(payload, meta);
  }
}
