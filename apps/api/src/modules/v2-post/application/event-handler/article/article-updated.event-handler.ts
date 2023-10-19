import { EventsHandlerAndLog } from '@libs/infra/log';
import { UserDto } from '@libs/service/user';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';
import { InternalEventEmitterService } from 'apps/api/src/app/custom/event-emitter';

import {
  SeriesAddedItemsEvent,
  SeriesChangedItemsEvent,
  SeriesRemovedItemsEvent,
} from '../../../../../events/series';
import { ISeriesState } from '../../../../../notification/activities';
import { ArticleUpdatedEvent } from '../../../domain/event';
import { ArticleEntity, SeriesEntity } from '../../../domain/model/content';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
  ITagRepository,
  TAG_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface';

@EventsHandlerAndLog(ArticleUpdatedEvent)
export class ArticleUpdatedEventHandler implements IEventHandler<ArticleUpdatedEvent> {
  public constructor(
    @Inject(TAG_REPOSITORY_TOKEN)
    private readonly _tagRepository: ITagRepository,
    // TODO: call domain and using event bus
    private readonly _internalEventEmitter: InternalEventEmitterService,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository
  ) {}

  public async handle(event: ArticleUpdatedEvent): Promise<void> {
    const { articleEntity, actor } = event;

    if (articleEntity.isHidden() || !articleEntity.isPublished()) {
      return;
    }

    await this._processTagsUsed(articleEntity);
    await this._processSeriesItemsChanged(articleEntity, actor);
  }

  private async _processTagsUsed(articleEntity: ArticleEntity): Promise<void> {
    const attachTagIds = articleEntity.getState().attachTagIds;
    const detachTagIds = articleEntity.getState().detachTagIds;

    const tagEntities = await this._tagRepository.findAll({
      ids: [...attachTagIds, ...detachTagIds],
    });

    const tagsMap = new Map(tagEntities.map((tag) => [tag.get('id'), tag]));

    for (const id of attachTagIds) {
      const tag = tagsMap.get(id);
      tag.increaseTotalUsed();
      await this._tagRepository.update(tag);
    }

    for (const id of detachTagIds) {
      const tag = tagsMap.get(id);
      if (tag.get('totalUsed') > 0) {
        tag.decreaseTotalUsed();
        await this._tagRepository.update(tag);
      }
    }
  }

  private async _processSeriesItemsChanged(
    articleEntity: ArticleEntity,
    actor: UserDto
  ): Promise<void> {
    const attachSeriesIds = articleEntity.getState().attachSeriesIds;
    const detachSeriesIds = articleEntity.getState().detachSeriesIds;

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

      if (sameOwnerItems.length && !articleEntity.isHidden()) {
        sameOwnerItems.forEach((so) => {
          this._internalEventEmitter.emit(
            new SeriesChangedItemsEvent({
              content: {
                id: articleEntity.getId(),
                content: articleEntity.get('content'),
                type: articleEntity.getType(),
                createdBy: articleEntity.getCreatedBy(),
                createdAt: articleEntity.get('createdAt'),
                updatedAt: articleEntity.get('updatedAt'),
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
            itemIds: [articleEntity.getId()],
            seriesId: seriesId,
            skipNotify: skipNotifyForNewItems.includes(seriesId) || articleEntity.isHidden(),
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
                id: articleEntity.getId(),
                title: articleEntity.getTitle(),
                content: articleEntity.get('content'),
                type: articleEntity.getType(),
                createdBy: articleEntity.getCreatedBy(),
                groupIds: articleEntity.getGroupIds(),
                createdAt: articleEntity.get('createdAt'),
              },
            ],
            seriesId: seriesId,
            skipNotify: skipNotifyForRemoveItems.includes(seriesId) || articleEntity.isHidden(),
            actor,
            contentIsDeleted: false,
          })
        )
      );
    }
  }
}
