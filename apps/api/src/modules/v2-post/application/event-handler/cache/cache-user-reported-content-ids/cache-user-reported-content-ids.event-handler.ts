import { ReportCreatedEvent } from '@api/modules/v2-post/domain/event';
import {
  CONTENT_CACHE_ADAPTER,
  IContentCacheAdapter,
} from '@api/modules/v2-post/domain/infra-adapter-interface';
import {
  IReportRepository,
  REPORT_REPOSITORY_TOKEN,
} from '@api/modules/v2-post/domain/repositoty-interface';
import { CONTENT_TARGET } from '@beincom/constants';
import { CACHE_KEYS } from '@libs/common/constants';
import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

@EventsHandlerAndLog(ReportCreatedEvent)
export class CacheUserReportedContentIdsEventHandler implements IEventHandler<ReportCreatedEvent> {
  public constructor(
    @Inject(CONTENT_CACHE_ADAPTER)
    private readonly _contentCacheAdapter: IContentCacheAdapter,
    @Inject(REPORT_REPOSITORY_TOKEN)
    private readonly _reportRepo: IReportRepository
  ) {}

  public async handle(event: ReportCreatedEvent): Promise<void> {
    const { reportEntities, authUser } = event.payload;
    const targetType = reportEntities[0].get('targetType');
    if (targetType === CONTENT_TARGET.COMMENT) {
      return;
    }

    const isCached = await this._contentCacheAdapter.hasKey(
      `${CACHE_KEYS.USER_REPORTED_CONTENT}:${authUser.id}`
    );

    if (!isCached) {
      const reportedTargetIds = await this._reportRepo.getTargetIdsByReporterId(authUser.id);
      await this._contentCacheAdapter.cacheUserReportedContent(authUser.id, reportedTargetIds);
    } else {
      const contentId = reportEntities[0].get('targetId');
      await this._contentCacheAdapter.cacheUserReportedContent(authUser.id, [contentId]);
    }
  }
}
