import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import { SearchService } from '../../../../search/search.service';
import { SeriesItemsAddedEvent } from '../../../domain/event';
import { SeriesEntity } from '../../../domain/model/content';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';

@EventsHandlerAndLog(SeriesItemsAddedEvent)
export class SearchSeriesItemsAddedEventHandler implements IEventHandler<SeriesItemsAddedEvent> {
  public constructor(
    private readonly _postSearchService: SearchService,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository
  ) {}

  public async handle(event: SeriesItemsAddedEvent): Promise<void> {
    const { seriesId } = event.payload;
    const seriesEntity = (await this._contentRepository.findContentByIdInActiveGroup(seriesId, {
      shouldIncludeItems: true,
    })) as SeriesEntity;

    if (!seriesEntity.isPublished()) {
      return;
    }

    await this._postSearchService.updateAttributePostToSearch(
      { id: seriesEntity.getId(), lang: seriesEntity.get('lang') },
      {
        itemIds: seriesEntity.getItemIds(),
      }
    );
  }
}
