import { EventsHandlerAndLog } from '@libs/infra/log';
import { IEventHandler } from '@nestjs/cqrs';

import { SearchService } from '../../../../search/search.service';
import { SeriesUpdatedEvent } from '../../../domain/event';
import { ImageDto } from '../../dto';

@EventsHandlerAndLog(SeriesUpdatedEvent)
export class SearchSeriesUpdatedEventHandler implements IEventHandler<SeriesUpdatedEvent> {
  public constructor(
    // TODO: Change to Adapter
    private readonly _postSearchService: SearchService
  ) {}

  public async handle(event: SeriesUpdatedEvent): Promise<void> {
    const { seriesEntity, actor } = event;

    await this._postSearchService.updatePostsToSearch([
      {
        id: seriesEntity.getId(),
        groupIds: seriesEntity.getGroupIds(),
        communityIds: seriesEntity.get('communityIds'),
        createdAt: seriesEntity.get('createdAt'),
        updatedAt: seriesEntity.get('updatedAt'),
        publishedAt: seriesEntity.get('publishedAt'),
        createdBy: actor.id,
        isHidden: seriesEntity.isHidden(),
        lang: seriesEntity.get('lang'),
        summary: seriesEntity.get('summary'),
        title: seriesEntity.getTitle(),
        type: seriesEntity.getType(),
        coverMedia: seriesEntity.get('cover')
          ? new ImageDto(seriesEntity.get('cover').toObject())
          : null,
      },
    ]);
  }
}
