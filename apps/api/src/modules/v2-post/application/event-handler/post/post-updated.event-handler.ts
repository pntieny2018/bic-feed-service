import { MEDIA_TYPE } from '@beincom/constants';
import { EventsHandlerAndLog } from '@libs/infra/log';
import { UserDto } from '@libs/service/user';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';
import { InternalEventEmitterService } from 'apps/api/src/app/custom/event-emitter';
import { KAFKA_TOPIC } from 'apps/api/src/common/constants';

import {
  SeriesAddedItemsEvent,
  SeriesChangedItemsEvent,
  SeriesRemovedItemsEvent,
} from '../../../../../events/series';
import { ISeriesState } from '../../../../../notification/activities';
import {
  IMediaDomainService,
  MEDIA_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { PostUpdatedEvent } from '../../../domain/event';
import { IKafkaAdapter, KAFKA_ADAPTER } from '../../../domain/infra-adapter-interface';
import { PostEntity, SeriesEntity } from '../../../domain/model/content';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';

@EventsHandlerAndLog(PostUpdatedEvent)
export class PostUpdatedEventHandler implements IEventHandler<PostUpdatedEvent> {
  public constructor(
    @Inject(MEDIA_DOMAIN_SERVICE_TOKEN)
    private readonly _mediaDomainService: IMediaDomainService,
    // TODO: call domain and using event bus
    private readonly _internalEventEmitter: InternalEventEmitterService,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(KAFKA_ADAPTER)
    private readonly _kafkaAdapter: IKafkaAdapter
  ) {}

  public async handle(event: PostUpdatedEvent): Promise<void> {
    const { postEntity, actor } = event.payload;

    if (postEntity.isPublished()) {
      await this._processMedia(postEntity, actor);
      await this._processSeriesItemsChanged(postEntity, actor);
    }

    if (postEntity.isProcessing() && postEntity.getVideoIdProcessing()) {
      await this._kafkaAdapter.emit(KAFKA_TOPIC.STREAM.VIDEO_POST_PUBLIC, {
        key: null,
        value: { videoIds: [postEntity.getVideoIdProcessing()] },
      });
    }
  }

  private async _processMedia(postEntity: PostEntity, actor: UserDto): Promise<void> {
    if (postEntity.getState().attachVideoIds.length) {
      await this._mediaDomainService.setMediaUsed(
        MEDIA_TYPE.VIDEO,
        postEntity.getState().attachVideoIds,
        actor.id
      );
    }
    if (postEntity.getState().attachFileIds.length) {
      await this._mediaDomainService.setMediaUsed(
        MEDIA_TYPE.FILE,
        postEntity.getState().attachFileIds,
        actor.id
      );
    }

    if (postEntity.getState().detachVideoIds.length) {
      await this._mediaDomainService.setMediaDelete(
        MEDIA_TYPE.VIDEO,
        postEntity.getState().detachVideoIds,
        actor.id
      );
    }

    if (postEntity.getState().detachFileIds.length) {
      await this._mediaDomainService.setMediaDelete(
        MEDIA_TYPE.FILE,
        postEntity.getState().detachFileIds,
        actor.id
      );
    }
  }

  private async _processSeriesItemsChanged(postEntity: PostEntity, actor: UserDto): Promise<void> {
    const attachSeriesIds = postEntity.getState().attachSeriesIds;
    const detachSeriesIds = postEntity.getState().detachSeriesIds;

    const seriesIdsNeedToFind = [...attachSeriesIds, ...detachSeriesIds];

    const seriesEntities = (await this._contentRepository.findAll({
      where: {
        groupArchived: false,
        isHidden: false,
        ids: seriesIdsNeedToFind,
      },
      include: {
        mustIncludeGroup: true,
      },
    })) as SeriesEntity[];

    const addSeries = seriesEntities.filter((series) => attachSeriesIds.includes(series.get('id')));
    const removeSeries = seriesEntities.filter((series) =>
      detachSeriesIds.includes(series.get('id'))
    );
    const removeSeriesWithState: ISeriesState[] = removeSeries.map((item: SeriesEntity) => ({
      id: item.get('id'),
      title: item.get('title'),
      actor: {
        id: item.get('createdBy'),
      },
      state: 'remove',
      audience: {
        groups: (item.get('groupIds') || []).map((groupId) => ({ id: groupId })),
      },
    }));
    const newSeriesWithState: ISeriesState[] = addSeries.map((item: SeriesEntity) => ({
      id: item.get('id'),
      title: item.get('title'),
      actor: {
        id: item.get('createdBy'),
      },
      state: 'add',
      audience: {
        groups: (item.get('groupIds') || []).map((groupId) => ({ id: groupId })),
      },
    }));

    let skipNotifyForNewItems = [];
    let skipNotifyForRemoveItems = [];

    if (newSeriesWithState.length && removeSeriesWithState.length) {
      const result = new Map<string, ISeriesState[]>();

      [...newSeriesWithState, ...removeSeriesWithState].forEach((item: ISeriesState): void => {
        const key = item.actor.id;
        if (!result.has(key)) {
          result.set(key, []);
        }
        const items = result.get(key);
        items.push(item);
        result.set(key, items);
      });

      const sameOwnerItems = [];

      result.forEach((r) => {
        const newItem = r.filter((i) => i.state === 'add');
        const removeItem = r.filter((i) => i.state === 'remove');
        if (newItem.length && removeItem.length) {
          sameOwnerItems.push(r);
          skipNotifyForNewItems = newItem.map((i) => i.id);
          skipNotifyForRemoveItems = removeItem.map((i) => i.id);
        }
      });

      if (sameOwnerItems.length && !postEntity.isHidden()) {
        sameOwnerItems.forEach((so) => {
          this._internalEventEmitter.emit(
            new SeriesChangedItemsEvent({
              content: {
                id: postEntity.getId(),
                content: postEntity.get('content'),
                type: postEntity.getType(),
                createdBy: postEntity.getCreatedBy(),
                createdAt: postEntity.get('createdAt'),
                updatedAt: postEntity.get('updatedAt'),
              } as any,
              series: so,
              actor,
            })
          );
        });
      }
    }

    if (attachSeriesIds.length > 0) {
      attachSeriesIds.forEach((seriesId) =>
        this._internalEventEmitter.emit(
          new SeriesAddedItemsEvent({
            itemIds: [postEntity.getId()],
            seriesId: seriesId,
            skipNotify: skipNotifyForNewItems.includes(seriesId) || postEntity.isHidden(),
            actor,
            context: 'publish',
          })
        )
      );
    }

    if (detachSeriesIds.length > 0) {
      detachSeriesIds.forEach((seriesId) =>
        this._internalEventEmitter.emit(
          new SeriesRemovedItemsEvent({
            items: [
              {
                id: postEntity.getId(),
                title: postEntity.getTitle(),
                content: postEntity.get('content'),
                type: postEntity.getType(),
                createdBy: postEntity.getCreatedBy(),
                groupIds: postEntity.getGroupIds(),
                createdAt: postEntity.get('createdAt'),
              },
            ],
            seriesId: seriesId,
            skipNotify: skipNotifyForRemoveItems.includes(seriesId) || postEntity.isHidden(),
            actor,
            contentIsDeleted: false,
          })
        )
      );
    }
  }
}
