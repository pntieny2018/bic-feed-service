import {
  ArticleUpdatedEvent,
  ContentUpdateSettingEvent,
  PostUpdatedEvent,
  SeriesUpdatedEvent,
} from '@api/modules/v2-post/domain/event';
import {
  CONTENT_CACHE_REPOSITORY_TOKEN,
  IContentCacheRepository,
} from '@api/modules/v2-post/domain/repositoty-interface/content-cache.repository.interface';
import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

@EventsHandlerAndLog(
  PostUpdatedEvent,
  ArticleUpdatedEvent,
  SeriesUpdatedEvent,
  ContentUpdateSettingEvent
)
export class DeleteCacheContentWhenContentUpdatedHandler implements IEventHandler {
  public constructor(
    @Inject(CONTENT_CACHE_REPOSITORY_TOKEN)
    private readonly contentCacheRepository: IContentCacheRepository
  ) {}

  public async handle(
    event: PostUpdatedEvent | ArticleUpdatedEvent | SeriesUpdatedEvent | ContentUpdateSettingEvent
  ): Promise<void> {
    let contentId: string;
    if (event instanceof ContentUpdateSettingEvent) {
      contentId = event.payload.contentId;
    } else {
      contentId = event.payload.entity.getId();
    }
    await this.contentCacheRepository.deleteContent(contentId);
  }
}
