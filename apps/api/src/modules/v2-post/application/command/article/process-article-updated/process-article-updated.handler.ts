import { SentryService } from '@libs/infra/sentry';
import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { InternalEventEmitterService } from '../../../../../../app/custom/event-emitter';
import { ArticleHasBeenUpdated } from '../../../../../../common/constants';
import {
  SeriesAddedItemsEvent,
  SeriesChangedItemsEvent,
  SeriesRemovedItemsEvent,
} from '../../../../../../events/series';
import { NotificationService } from '../../../../../../notification';
import { ISeriesState, PostActivityService } from '../../../../../../notification/activities';
import {
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../../../../v2-group/application';
import { SeriesEntity } from '../../../../domain/model/content';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
  ITagRepository,
  TAG_REPOSITORY_TOKEN,
} from '../../../../domain/repositoty-interface';
import { ArticleChangedMessagePayload } from '../../../dto/message';

import { ProcessArticleUpdatedCommand } from './process-article-updated.command';

@CommandHandler(ProcessArticleUpdatedCommand)
export class ProcessArticleUpdatedHandler
  implements ICommandHandler<ProcessArticleUpdatedCommand, void>
{
  private _logger = new Logger(ProcessArticleUpdatedHandler.name);

  public constructor(
    @Inject(TAG_REPOSITORY_TOKEN)
    private readonly _tagRepository: ITagRepository,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(GROUP_APPLICATION_TOKEN)
    private readonly _groupApplicationService: IGroupApplicationService,
    private readonly _sentryService: SentryService,
    private readonly _notificationService: NotificationService, //TODO improve interface later
    private readonly _internalEventEmitter: InternalEventEmitterService, //TODO improve interface later
    private readonly _postActivityService: PostActivityService //TODO improve interface later
  ) {}

  public async execute(command: ProcessArticleUpdatedCommand): Promise<void> {
    try {
      await this._processTagsUsed(command.payload);
      await this._processNotification(command.payload);
      await this._processSeriesItemsChanged(command.payload);
    } catch (err) {
      this._logger.error(JSON.stringify(err?.stack));
      this._sentryService.captureException(err);
    }
  }

  private async _processTagsUsed(payload: ArticleChangedMessagePayload): Promise<void> {
    const { after } = payload;
    const { state } = after || {};
    const { attachTagIds, detachTagIds } = state;

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

  private async _processNotification(payload: ArticleChangedMessagePayload): Promise<void> {
    const { before, after } = payload;

    if (after.isHidden) {
      return;
    }

    const seriesEntites = (await this._contentRepository.findAll({
      where: {
        groupArchived: false,
        isHidden: false,
        ids: after.seriesIds,
      },
    })) as SeriesEntity[];

    const groups = await this._groupApplicationService.findAllByIds(after.groupIds);
    const updatedActivity = this._postActivityService.createPayload({
      id: after.id,
      title: after.title,
      content: after.content,
      contentType: after.type,
      setting: after.setting,
      audience: {
        groups,
      },
      actor: after.actor,
      createdAt: after.createdAt,
    });

    const oldGroups = await this._groupApplicationService.findAllByIds(before.groupIds);
    const oldActivity = this._postActivityService.createPayload({
      id: before.id,
      title: before.title,
      content: before.content,
      contentType: before.type,
      setting: before.setting,
      audience: {
        groups: oldGroups,
      },
      actor: before.actor,
      createdAt: before.createdAt,
    });

    await this._notificationService.publishPostNotification({
      key: `${after.id}`,
      value: {
        actor: after.actor,
        event: ArticleHasBeenUpdated,
        data: updatedActivity,
        meta: {
          post: {
            oldData: oldActivity,
            ignoreUserIds: seriesEntites?.map((series) => series.get('createdBy')),
          },
        },
      },
    });
  }

  private async _processSeriesItemsChanged(payload: ArticleChangedMessagePayload): Promise<void> {
    const { after } = payload;
    const { state } = after || {};
    const { attachSeriesIds, detachSeriesIds } = state;

    const seriesIdsNeedToFind = [...attachSeriesIds, ...detachSeriesIds];

    const seriesEntites = (await this._contentRepository.findAll({
      where: {
        groupArchived: false,
        isHidden: false,
        ids: seriesIdsNeedToFind,
      },
      include: {
        mustIncludeGroup: true,
      },
    })) as SeriesEntity[];

    const addSeries = seriesEntites.filter((series) =>
      state.attachSeriesIds.includes(series.get('id'))
    );
    const removeSeries = seriesEntites.filter((series) =>
      state.detachSeriesIds.includes(series.get('id'))
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

      if (sameOwnerItems.length && !after.isHidden) {
        sameOwnerItems.forEach((so) => {
          this._internalEventEmitter.emit(
            new SeriesChangedItemsEvent({
              content: {
                id: after.id,
                content: after.content,
                type: after.type,
                createdBy: after.actor.id,
                createdAt: after.createdAt,
                updatedAt: after.createdAt,
              } as any,
              series: so,
              actor: after.actor,
            })
          );
        });
      }
    }

    if (attachSeriesIds.length > 0) {
      attachSeriesIds.forEach((seriesId) =>
        this._internalEventEmitter.emit(
          new SeriesAddedItemsEvent({
            itemIds: [after.id],
            seriesId: seriesId,
            skipNotify: skipNotifyForNewItems.includes(seriesId) || after.isHidden,
            actor: after.actor,
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
                id: after.id,
                title: after.title,
                content: after.content,
                type: after.type,
                createdBy: after.actor.id,
                groupIds: after.groupIds,
                createdAt: after.createdAt,
              },
            ],
            seriesId: seriesId,
            skipNotify: skipNotifyForRemoveItems.includes(seriesId) || after.isHidden,
            actor: after.actor,
            contentIsDeleted: false,
          })
        )
      );
    }
  }
}
