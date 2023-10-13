import { MEDIA_TYPE } from '@beincom/constants';
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { InternalEventEmitterService } from '../../../../../../app/custom/event-emitter';
import { PostHasBeenUpdated } from '../../../../../../common/constants';
import {
  SeriesAddedItemsEvent,
  SeriesChangedItemsEvent,
  SeriesRemovedItemsEvent,
} from '../../../../../../events/series';
import { NotificationService } from '../../../../../../notification';
import { ISeriesState, PostActivityService } from '../../../../../../notification/activities';
import {
  IMediaDomainService,
  MEDIA_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import { PostEntity, SeriesEntity } from '../../../../domain/model/content';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
} from '../../../../domain/repositoty-interface';
import {
  GROUP_ADAPTER,
  IGroupAdapter,
  IUserAdapter,
  USER_ADAPTER,
} from '../../../../domain/service-adapter-interface';
import { CONTENT_BINDING_TOKEN, IContentBinding } from '../../../binding';

import { ProcessPostUpdatedCommand } from './process-post-updated.command';

@CommandHandler(ProcessPostUpdatedCommand)
export class ProcessPostUpdatedHandler implements ICommandHandler<ProcessPostUpdatedCommand, void> {
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(GROUP_ADAPTER)
    private readonly _groupAdapter: IGroupAdapter,
    @Inject(USER_ADAPTER)
    private readonly _userAdapter: IUserAdapter,
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding,
    @Inject(MEDIA_DOMAIN_SERVICE_TOKEN)
    private readonly _mediaDomainService: IMediaDomainService,
    private readonly _notificationService: NotificationService, //TODO improve interface later
    private readonly _postActivityService: PostActivityService, //TODO improve interface later
    private readonly _internalEventEmitter: InternalEventEmitterService //TODO improve interface later
  ) {}

  public async execute(command: ProcessPostUpdatedCommand): Promise<void> {
    const { after } = command.payload;

    const postEntity = await this._contentRepository.findOne({
      where: {
        id: after.id,
      },
    });

    if (!postEntity) {
      return;
    }
    if (postEntity instanceof PostEntity) {
      await this._processMedia(command);
      if (!postEntity.isHidden()) {
        await this._processNotification(command);
      }
    }
  }

  private async _processNotification(command: ProcessPostUpdatedCommand): Promise<void> {
    const { before, after } = command.payload;

    const series = await this._contentRepository.findAll({
      attributes: {
        exclude: ['content'],
      },
      where: {
        ids: after.seriesIds,
      },
    });
    const groups = await this._groupAdapter.getGroupsByIds(after.groupIds);
    const mentionUsers = await this._userAdapter.getUsersByIds(after.mentionUserIds);
    const updatedActivity = this._postActivityService.createPayload({
      id: after.id,
      title: null,
      content: after.content,
      contentType: after.type,
      setting: after.setting,
      audience: {
        groups,
      },
      mentions: this._contentBinding.mapMentionWithUserInfo(mentionUsers) as any,
      actor: after.actor,
      createdAt: after.createdAt,
    });
    let oldActivity = undefined;

    const oldMentionUsers = await this._userAdapter.getUsersByIds(before.mentionUserIds);
    const oldMentions = this._contentBinding.mapMentionWithUserInfo(oldMentionUsers);
    const oldGroups = await this._groupAdapter.getGroupsByIds(before.groupIds);

    oldActivity = this._postActivityService.createPayload({
      id: before.id,
      title: null,
      content: before.content,
      contentType: before.type,
      setting: before.setting,
      audience: {
        groups: oldGroups,
      },
      mentions: oldMentions as any,
      actor: before.actor,
      createdAt: before.createdAt,
    });
    await this._notificationService.publishPostNotification({
      key: after.id,
      value: {
        actor: {
          id: after.actor.id,
        },
        event: PostHasBeenUpdated,
        data: updatedActivity,
        meta: {
          post: {
            oldData: oldActivity,
            ignoreUserIds: series.map((series: SeriesEntity) => series.get('createdBy')),
          },
        },
      },
    });

    const removeSeries = await this._contentRepository.findAll({
      attributes: {
        exclude: ['content'],
      },
      where: {
        ids: after.state.detachSeriesIds,
      },
      include: {
        mustIncludeGroup: true,
      },
    });

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

    const newSeries = await this._contentRepository.findAll({
      attributes: {
        exclude: ['content'],
      },
      where: {
        ids: after.state.attachSeriesIds,
      },
      include: {
        mustIncludeGroup: true,
      },
    });
    const newSeriesWithState: ISeriesState[] = newSeries.map((item: SeriesEntity) => ({
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

    if (after.state.attachSeriesIds.length > 0) {
      after.state.attachSeriesIds.forEach((seriesId) =>
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

    if (after.state.detachSeriesIds.length > 0) {
      after.state.detachSeriesIds.forEach((seriesId) =>
        this._internalEventEmitter.emit(
          new SeriesRemovedItemsEvent({
            items: [
              {
                id: after.id,
                title: null,
                content: after.content,
                type: after.type,
                createdBy: after.actor.id,
                groupIds: after.groupIds,
                createdAt: after.createdAt,
                // updatedAt: newPost.updatedAt,
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

  private async _processMedia(command: ProcessPostUpdatedCommand): Promise<void> {
    const { after } = command.payload;
    if (after.state.attachVideoIds.length) {
      await this._mediaDomainService.setMediaUsed(
        MEDIA_TYPE.VIDEO,
        after.state.attachVideoIds,
        after.actor.id
      );
    }
    if (after.state.attachFileIds.length) {
      await this._mediaDomainService.setMediaUsed(
        MEDIA_TYPE.FILE,
        after.state.attachFileIds,
        after.actor.id
      );
    }

    if (after.state.detachVideoIds.length) {
      await this._mediaDomainService.setMediaDelete(
        MEDIA_TYPE.VIDEO,
        after.state.detachVideoIds,
        after.actor.id
      );
    }

    if (after.state.detachFileIds.length) {
      await this._mediaDomainService.setMediaDelete(
        MEDIA_TYPE.FILE,
        after.state.detachFileIds,
        after.actor.id
      );
    }
  }
}
