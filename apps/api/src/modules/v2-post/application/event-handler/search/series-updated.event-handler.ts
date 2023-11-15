import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';
import { uniq } from 'lodash';

import { SearchService } from '../../../../search/search.service';
import { SeriesUpdatedEvent } from '../../../domain/event';
import { GROUP_ADAPTER, IGroupAdapter } from '../../../domain/service-adapter-interface';
import { ImageDto } from '../../dto';

@EventsHandlerAndLog(SeriesUpdatedEvent)
export class SearchSeriesUpdatedEventHandler implements IEventHandler<SeriesUpdatedEvent> {
  public constructor(
    @Inject(GROUP_ADAPTER)
    private readonly _groupAdapter: IGroupAdapter,
    // TODO: Change to Adapter
    private readonly _postSearchService: SearchService
  ) {}

  public async handle(event: SeriesUpdatedEvent): Promise<void> {
    const { seriesEntity, actor } = event;

    const groups = await this._groupAdapter.getGroupsByIds(seriesEntity.get('groupIds'));
    const communityIds = uniq(groups.map((group) => group.rootGroupId));

    await this._postSearchService.updatePostsToSearch([
      {
        id: seriesEntity.getId(),
        groupIds: seriesEntity.getGroupIds(),
        communityIds,
        createdAt: seriesEntity.get('createdAt'),
        updatedAt: seriesEntity.get('updatedAt'),
        publishedAt: seriesEntity.get('publishedAt'),
        createdBy: actor.id,
        isHidden: seriesEntity.isHidden(),
        lang: seriesEntity.get('lang'),
        summary: seriesEntity.get('summary'),
        title: seriesEntity.getTitle(),
        type: seriesEntity.getType(),
        items: seriesEntity.get('items'),
        coverMedia: seriesEntity.get('cover')
          ? new ImageDto(seriesEntity.get('cover').toObject())
          : null,
      },
    ]);
  }
}
