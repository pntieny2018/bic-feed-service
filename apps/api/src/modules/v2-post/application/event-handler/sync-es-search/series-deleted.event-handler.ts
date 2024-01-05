import { EventsHandlerAndLog } from '@libs/infra/log';
import { IEventHandler } from '@nestjs/cqrs';

import { SearchService } from '../../../../search/search.service';
import { SeriesDeletedEvent } from '../../../domain/event';

@EventsHandlerAndLog(SeriesDeletedEvent)
export class SearchSeriesDeletedEventHandler implements IEventHandler<SeriesDeletedEvent> {
  public constructor(
    // TODO: Change to Adapter
    private readonly _postSearchService: SearchService
  ) {}

  public async handle(event: SeriesDeletedEvent): Promise<void> {
    const { entity: seriesEntity } = event.payload;

    await this._postSearchService.deletePostsToSearch([{ id: seriesEntity.getId() }]);

    if (seriesEntity.get('itemIds')?.length && !seriesEntity.isHidden()) {
      await this._postSearchService.updateAttachedSeriesForPost(seriesEntity.get('itemIds'));
    }
  }
}
