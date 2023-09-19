import { ORDER } from '@beincom/constants';
import { IPaginatedInfo } from '@libs/database/postgres/common';
import { RedisService } from '@libs/infra/redis';
import { SentryService } from '@libs/infra/sentry';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { isBoolean } from 'class-validator';
import moment from 'moment';

import { CACHE_KEYS, CRON_RUN_SCHEDULED_ARTICLE } from '../../../../common/constants';
import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  GetScheduledContentProps,
  IContentDomainService,
} from '../../domain/domain-service/interface';
import { IQueueAdapter, QUEUE_ADAPTER } from '../../domain/infra-adapter-interface';

@Injectable()
export class ArticleCron {
  private readonly _logger = new Logger(ArticleCron.name);

  private readonly LIMIT_DEFAULT = 100;

  public constructor(
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService,
    @Inject(QUEUE_ADAPTER)
    private readonly _queueAdapter: IQueueAdapter,
    private readonly _redisService: RedisService,
    private readonly _sentryService: SentryService
  ) {}

  @Cron(CRON_RUN_SCHEDULED_ARTICLE)
  public async handleJobScheduledArticle(): Promise<void> {
    this._logger.log('[Cron Job] Scheduled Article');

    const bufferTimeInMinute = 1;
    const beforeDate = moment().add(bufferTimeInMinute, 'minute').toDate();
    const canRunScheduleArticle = await this._redisService.setNxEx(
      CACHE_KEYS.IS_RUNNING_ARTICLE_SCHEDULE,
      true
    );

    if (canRunScheduleArticle === 1) {
      try {
        const payload: GetScheduledContentProps = {
          limit: this.LIMIT_DEFAULT,
          order: ORDER.DESC,
          beforeDate,
        };
        return this._recursivelyHandleScheduledContent(payload);
      } catch (err) {
        this._logger.error(JSON.stringify(err?.stack));
        this._sentryService.captureException(err);
      }

      await this._redisService.del(CACHE_KEYS.IS_RUNNING_ARTICLE_SCHEDULE);
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

    const contentScheduledJobPayloads = rows.map((row) => ({
      articleId: row.getId(),
      articleOwnerId: row.getCreatedBy(),
    }));

    await this._queueAdapter.addArticleScheduledJobs(contentScheduledJobPayloads);

    await this._recursivelyHandleScheduledContent(payload, meta);
  }
}
