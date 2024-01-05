import {
  SeriesItemsAddedEvent,
  SeriesItemsRemovedEvent,
  SeriesItemsReorderedEvent,
} from '@api/modules/v2-post/domain/event';
import {
  CONTENT_CACHE_REPOSITORY_TOKEN,
  IContentCacheRepository,
} from '@api/modules/v2-post/domain/repositoty-interface/content-cache.repository.interface';
import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

@EventsHandlerAndLog(SeriesItemsAddedEvent, SeriesItemsRemovedEvent, SeriesItemsReorderedEvent)
export class DeleteCacheContentWhenSeriesUpdatedItemsHandler implements IEventHandler {
  public constructor(
    @Inject(CONTENT_CACHE_REPOSITORY_TOKEN)
    private readonly contentCacheRepository: IContentCacheRepository
  ) {}

  public async handle(
    event: SeriesItemsAddedEvent | SeriesItemsRemovedEvent | SeriesItemsReorderedEvent
  ): Promise<void> {
    const contentId = event.payload.seriesId;

    await this.contentCacheRepository.deleteContent(contentId);
  }
}
