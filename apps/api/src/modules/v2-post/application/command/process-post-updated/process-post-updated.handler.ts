import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  IPostDomainService,
  POST_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { ProcessPostUpdatedCommand } from './process-post-updated.command';
import { IPostRepository, POST_REPOSITORY_TOKEN } from '../../../domain/repositoty-interface';
import { IPostValidator, POST_VALIDATOR_TOKEN } from '../../../domain/validator/interface';
import {
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../../../v2-group/application';
import { PostEntity } from '../../../domain/model/content';
import { IUserApplicationService, USER_APPLICATION_TOKEN } from '../../../../v2-user/application';
import { PostStatus } from '../../../../../database/models/post.model';
import { MediaService } from '../../../../media';
import { MediaMarkAction, MediaType } from '../../../../../database/models/media.model';
import {
  KAFKA_PRODUCER,
  KAFKA_TOPIC,
  PostHasBeenPublished,
  PostHasBeenUpdated,
} from '../../../../../common/constants';
import { ClientKafka } from '@nestjs/microservices';
import { NotificationService } from '../../../../../notification';
import { ISeriesState, PostActivityService } from '../../../../../notification/activities';
import { CONTENT_BINDING_TOKEN } from '../../binding/binding-post/content.interface';
import { ContentBinding } from '../../binding/binding-post/content.binding';
import {
  SeriesAddedItemsEvent,
  SeriesChangedItemsEvent,
  SeriesRemovedItemsEvent,
} from '../../../../../events/series';
import { InternalEventEmitterService } from '../../../../../app/custom/event-emitter';
import { ProcessPostPublishedCommand } from '../process-post-published/process-post-published.command';

@CommandHandler(ProcessPostUpdatedCommand)
export class ProcessPostUpdatedHandler implements ICommandHandler<ProcessPostUpdatedCommand, void> {
  public constructor(
    @Inject(POST_REPOSITORY_TOKEN) private readonly _postRepository: IPostRepository,
    @Inject(POST_DOMAIN_SERVICE_TOKEN) private readonly _postDomainService: IPostDomainService,
    @Inject(GROUP_APPLICATION_TOKEN)
    private readonly _groupApplicationService: IGroupApplicationService,
    @Inject(USER_APPLICATION_TOKEN)
    private readonly _userApplicationService: IUserApplicationService,
    @Inject(POST_VALIDATOR_TOKEN) private readonly _postValidator: IPostValidator,
    @Inject(CONTENT_BINDING_TOKEN) private readonly _contentBinding: ContentBinding,
    @Inject(KAFKA_PRODUCER)
    private readonly _clientKafka: ClientKafka,
    private readonly _mediaService: MediaService, //TODO improve interface later
    private readonly _notificationService: NotificationService, //TODO improve interface later
    private readonly _postActivityService: PostActivityService, //TODO improve interface later
    private readonly _internalEventEmitter: InternalEventEmitterService //TODO improve interface later
  ) {}

  public async execute(command: ProcessPostUpdatedCommand): Promise<void> {
    const { before, after } = command.payload;

    const postEntity = await this._postRepository.findOne({
      where: {
        id: after.id,
      },
    });

    if (!postEntity) return;
    if (postEntity instanceof PostEntity) {
      await this._processMedia(command, postEntity);
      if (!postEntity.isHidden()) {
        await this._processNotification(command, postEntity);
      }
    }
  }

  private async _processNotification(
    command: ProcessPostUpdatedCommand,
    postEntity: PostEntity
  ): Promise<void> {
    const { before, after, isPublished } = command.payload;

    const series = await this._postRepository.findAll({
      attributes: ['id', 'createdBy'], //TODO enhance get attributes repo
      where: {
        ids: after.seriesIds,
      },
    });
    const groups = await this._groupApplicationService.findAllByIds(after.groupIds);
    const mentionUsers = await this._userApplicationService.findAllByIds(after.mentionUserIds);
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

    if (!isPublished) {
      const mentionUsers = await this._userApplicationService.findAllByIds(before.mentionUserIds);
      const mentions = this._contentBinding.mapMentionWithUserInfo(mentionUsers);
      const oldGroups = await this._groupApplicationService.findAllByIds(before.groupIds);
      oldActivity = this._postActivityService.createPayload({
        id: after.id,
        title: null,
        content: after.content,
        contentType: after.type,
        setting: after.setting,
        audience: {
          groups: oldGroups,
        },
        mentions: mentions as any,
        actor: after.actor,
        createdAt: after.createdAt,
      });
    }
    await this._notificationService.publishPostNotification({
      key: after.id,
      value: {
        actor: {
          id: after.actor.id,
        },
        event: isPublished ? PostHasBeenPublished : PostHasBeenUpdated,
        data: updatedActivity,
        meta: {
          post: {
            oldData: oldActivity,
            ignoreUserIds: series.map((series) => series.get('createdBy')),
          },
        },
      },
    });

    const removeSeries = await this._postRepository.findAll({
      attributes: ['id', 'createdBy', 'title'],
      where: {
        ids: after.state.detachSeriesIds,
      },
    });

    const removeSeriesWithState = removeSeries.map((item) => ({
      id: item.get('id'),
      title: item.get('title'),
      actor: {
        id: item.get('createdBy'),
      },
      state: 'remove',
    }));

    const newSeries = await this._postRepository.findAll({
      attributes: ['id', 'createdBy', 'title'],
      where: {
        ids: after.state.attachSeriesIds,
      },
    });
    const newSeriesWithState = newSeries.map((item) => ({
      id: item.get('id'),
      title: item.get('title'),
      actor: {
        id: item.get('createdBy'),
      },
      state: 'add',
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

  private async _processMedia(
    command: ProcessPostPublishedCommand,
    postEntity: PostEntity
  ): Promise<void> {
    const { after } = command.payload;
    if (after.state.attachVideoIds.length) {
      await this._mediaService.emitMediaToUploadService(
        MediaType.VIDEO,
        MediaMarkAction.USED,
        after.state.attachVideoIds,
        after.actor.id
      );
    }
    if (after.state.attachFileIds.length) {
      await this._mediaService.emitMediaToUploadService(
        MediaType.FILE,
        MediaMarkAction.USED,
        after.state.attachFileIds,
        after.actor.id
      );
    }

    if (after.state.detachVideoIds.length) {
      await this._mediaService.emitMediaToUploadService(
        MediaType.VIDEO,
        MediaMarkAction.DELETE,
        after.state.detachVideoIds,
        after.actor.id
      );
    }

    if (after.state.detachFileIds.length) {
      await this._mediaService.emitMediaToUploadService(
        MediaType.FILE,
        MediaMarkAction.DELETE,
        after.state.detachFileIds,
        after.actor.id
      );
    }

    if (postEntity.isProcessing() && postEntity.getVideoIdProcessing()) {
      this._clientKafka.emit(KAFKA_TOPIC.STREAM.VIDEO_POST_PUBLIC, {
        key: null,
        value: JSON.stringify({ videoIds: [postEntity.getVideoIdProcessing()] }),
      });
    }
  }
}
