import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';
import { uniq } from 'lodash';

import { SearchService } from '../../../../search/search.service';
import { SeriesCreatedEvent } from '../../../domain/event';
import { GROUP_ADAPTER, IGroupAdapter } from '../../../domain/service-adapter-interface';
import { IMediaBinding, MEDIA_BINDING_TOKEN } from '../../binding/binding-media';

@EventsHandlerAndLog(SeriesCreatedEvent)
export class SearchSeriesPublishedEventHandler implements IEventHandler<SeriesCreatedEvent> {
  public constructor(
    @Inject(MEDIA_BINDING_TOKEN)
    private readonly _mediaBinding: IMediaBinding,
    @Inject(GROUP_ADAPTER)
    private readonly _groupAdapter: IGroupAdapter,
    // TODO: Change to Adapter
    private readonly _postSearchService: SearchService
  ) {}

  public async handle(event: SeriesCreatedEvent): Promise<void> {
    const { seriesEntity, actor } = event;

    const groups = await this._groupAdapter.getGroupsByIds(seriesEntity.get('groupIds'));
    const communityIds = uniq(groups.map((group) => group.rootGroupId));

    await this._postSearchService.addPostsToSearch([
      {
        id: seriesEntity.getId(),
        createdAt: seriesEntity.get('createdAt'),
        updatedAt: seriesEntity.get('updatedAt'),
        publishedAt: seriesEntity.get('publishedAt'),
        createdBy: actor.id,
        title: seriesEntity.getTitle(),
        summary: seriesEntity.get('summary'),
        groupIds: seriesEntity.getGroupIds(),
        isHidden: seriesEntity.isHidden(),
        communityIds,
        type: seriesEntity.getType(),
        items: [],
        coverMedia: this._mediaBinding.imageBinding(seriesEntity.get('cover')),
      },
    ]);
  }
}
