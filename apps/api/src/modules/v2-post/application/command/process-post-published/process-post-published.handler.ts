import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  IPostDomainService,
  POST_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { ProcessPostPublishedCommand } from './process-post-published.command';
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
import { PostActivityService } from '../../../../../notification/activities';
import { CONTENT_BINDING_TOKEN } from '../../binding/binding-post/content.interface';
import { ContentBinding } from '../../binding/binding-post/content.binding';

@CommandHandler(ProcessPostPublishedCommand)
export class ProcessPostPublishedHandler
  implements ICommandHandler<ProcessPostPublishedCommand, void>
{
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
    private readonly _postActivityService: PostActivityService //TODO improve interface later
  ) {}

  public async execute(command: ProcessPostPublishedCommand): Promise<void> {
    const { before, after } = command.payload;

    const postEntity = await this._postRepository.findOne({
      where: {
        id: after.id,
      },
    });

    if (!postEntity) return;
    if (postEntity instanceof PostEntity) {
      await this._processMedia(postEntity);
      if (!postEntity.isHidden()) {
        await this._processNotification(command, postEntity);
      }
    }
  }

  private async _processNotification(
    command: ProcessPostPublishedCommand,
    PostEntity: PostEntity
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
  }

  private async _processMedia(postEntity: PostEntity): Promise<void> {
    if (postEntity.getState().attachVideoIds.length) {
      await this._mediaService.emitMediaToUploadService(
        MediaType.VIDEO,
        MediaMarkAction.USED,
        postEntity.getState().attachVideoIds,
        postEntity.get('createdBy')
      );
    }
    if (postEntity.getState().attachFileIds.length) {
      await this._mediaService.emitMediaToUploadService(
        MediaType.FILE,
        MediaMarkAction.USED,
        postEntity.getState().attachFileIds,
        postEntity.get('createdBy')
      );
    }

    if (postEntity.getState().detachVideoIds.length) {
      await this._mediaService.emitMediaToUploadService(
        MediaType.VIDEO,
        MediaMarkAction.DELETE,
        postEntity.getState().detachVideoIds,
        postEntity.get('createdBy')
      );
    }

    if (postEntity.getState().detachFileIds.length) {
      await this._mediaService.emitMediaToUploadService(
        MediaType.FILE,
        MediaMarkAction.DELETE,
        postEntity.getState().detachFileIds,
        postEntity.get('createdBy')
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
