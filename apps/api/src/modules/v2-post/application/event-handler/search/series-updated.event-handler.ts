import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';
import { uniq } from 'lodash';

import { SearchService } from '../../../../search/search.service';
import { SeriesUpdatedEvent } from '../../../domain/event';
import { GROUP_ADAPTER, IGroupAdapter } from '../../../domain/service-adapter-interface';
import { IMediaBinding, MEDIA_BINDING_TOKEN } from '../../binding/binding-media';

@EventsHandlerAndLog(SeriesUpdatedEvent)
export class SearchSeriesUpdatedEventHandler implements IEventHandler<SeriesUpdatedEvent> {
  public constructor(
    @Inject(MEDIA_BINDING_TOKEN)
    private readonly _mediaBinding: IMediaBinding,
    @Inject(GROUP_ADAPTER)
    private readonly _groupAdapter: IGroupAdapter,
    // TODO: Change to Adapter
    private readonly _postSearchService: SearchService
  ) {}

  public async handle(event: SeriesUpdatedEvent): Promise<void> {
    const { seriesEntity, authUser } = event.payload;

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
        createdBy: authUser.id,
        isHidden: seriesEntity.isHidden(),
        lang: seriesEntity.get('lang'),
        summary: seriesEntity.get('summary'),
        title: seriesEntity.getTitle(),
        type: seriesEntity.getType(),
        itemIds: seriesEntity.getItemIds(),
        coverMedia: this._mediaBinding.imageBinding(seriesEntity.get('cover')),
      },
    ]);
  }
}
