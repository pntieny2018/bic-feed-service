import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';
import { uniq } from 'lodash';

import { PostHasBeenUpdated } from '../../../../../common/constants';
import { PostUpdatedEvent } from '../../../domain/event';
import { PostEntity, SeriesEntity } from '../../../domain/model/content';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import {
  INotificationAdapter,
  NOTIFICATION_ADAPTER,
} from '../../../domain/service-adapter-interface';
import { CONTENT_BINDING_TOKEN, IContentBinding } from '../../binding';

@EventsHandlerAndLog(PostUpdatedEvent)
export class NotiPostUpdatedEventHandler implements IEventHandler<PostUpdatedEvent> {
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding,
    @Inject(NOTIFICATION_ADAPTER)
    private readonly _notiAdapter: INotificationAdapter
  ) {}

  public async handle(event: PostUpdatedEvent): Promise<void> {
    const { postEntity, actor } = event.payload;

    if (postEntity.isHidden() || !postEntity.isPublished()) {
      return;
    }

    const contentWithArchivedGroups = (await this._contentRepository.findContentByIdInArchivedGroup(
      postEntity.getId(),
      { shouldIncludeSeries: true }
    )) as PostEntity;

    const seriesIds = uniq([
      ...postEntity.getSeriesIds(),
      ...(contentWithArchivedGroups ? contentWithArchivedGroups?.getSeriesIds() : []),
    ]);
    const seriesEntities = (await this._contentRepository.findAll({
      where: {
        groupArchived: false,
        isHidden: false,
        ids: seriesIds,
      },
    })) as SeriesEntity[];

    const postDto = await this._contentBinding.postBinding(postEntity, {
      actor,
      authUser: actor,
    });

    const oldPostDto = await this._contentBinding.postAttributesBinding(postEntity.getSnapshot(), {
      actor,
      authUser: actor,
    });

    const seriesActorIds = (seriesEntities || []).map((series) => series.get('createdBy'));

    await this._notiAdapter.sendPostNotification({
      event: PostHasBeenUpdated,
      actor,
      post: postDto,
      oldPost: oldPostDto,
      ignoreUserIds: seriesActorIds,
    });
  }
}