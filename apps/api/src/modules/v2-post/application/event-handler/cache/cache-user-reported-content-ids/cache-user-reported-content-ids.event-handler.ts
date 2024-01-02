import { ReportCreatedEvent } from '@api/modules/v2-post/domain/event';
import {
  IReportRepository,
  REPORT_REPOSITORY_TOKEN,
} from '@api/modules/v2-post/domain/repositoty-interface';
import {
  CONTENT_CACHE_REPOSITORY_TOKEN,
  IContentCacheRepository,
} from '@api/modules/v2-post/domain/repositoty-interface/content-cache.repository.interface';
import { CACHE_KEYS } from '@libs/common/constants';
import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

@EventsHandlerAndLog(ReportCreatedEvent)
export class CacheUserReportedContentIdsEventHandler implements IEventHandler<ReportCreatedEvent> {
  public constructor(
    @Inject(CONTENT_CACHE_REPOSITORY_TOKEN)
    private readonly contentCacheRepository: IContentCacheRepository,
    @Inject(REPORT_REPOSITORY_TOKEN)
    private readonly _reportRepo: IReportRepository
  ) {}

  public async handle(event: ReportCreatedEvent): Promise<void> {
    const { reportEntities, authUser } = event.payload;

    const isCached = await this.contentCacheRepository.existKey(
      `${CACHE_KEYS.USER_REPORTED_CONTENT}:${authUser.id}`
    );

    if (!isCached) {
      await this._reportRepo.getTargetIdsByReporterId(authUser.id);
    } else {
      const contentId = reportEntities[0].get('targetId');
      await this.contentCacheRepository.cacheUserReportedContent(authUser.id, [contentId]);
    }
  }
}