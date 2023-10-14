import { Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import { SearchService } from '../../../../search/search.service';
import { SeriesItemsRemovedEvent } from '../../../domain/event';
import { SeriesEntity } from '../../../domain/model/content';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';

@EventsHandler(SeriesItemsRemovedEvent)
export class SearchSeriesItemsRemovedEventHandler
  implements IEventHandler<SeriesItemsRemovedEvent>
{
  public constructor(
    private readonly _postSearchService: SearchService,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository
  ) {}

  public async handle(event: SeriesItemsRemovedEvent): Promise<void> {
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
        items: seriesEntity.get('items'),
      }
    );
  }
}
