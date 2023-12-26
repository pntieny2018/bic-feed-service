import { ReportHiddenEvent } from '@api/modules/v2-post/domain/event';
import {
  CONTENT_CACHE_REPOSITORY_TOKEN,
  IContentCacheRepository,
} from '@api/modules/v2-post/domain/repositoty-interface/content-cache.repository.interface';
import { CONTENT_TARGET } from '@beincom/constants';
import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

@EventsHandlerAndLog(ReportHiddenEvent)
export class DeleteCacheContentWhenAdminHidHandler implements IEventHandler<ReportHiddenEvent> {
  public constructor(
    @Inject(CONTENT_CACHE_REPOSITORY_TOKEN)
    private readonly contentCacheRepository: IContentCacheRepository
  ) {}

  public async handle(event: ReportHiddenEvent): Promise<void> {
    const { reportEntities } = event.payload;
    const targetId = reportEntities[0].get('targetId');
    const targetType = reportEntities[0].get('targetType');

    if (targetType === CONTENT_TARGET.COMMENT) {
      return;
    }

    await this.contentCacheRepository.deleteContent(targetId);
  }
}
