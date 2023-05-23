import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  IPostDomainService,
  POST_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { ProcessPostPublishedCommand } from './process-post-published.command';
import { IContentRepository, CONTENT_REPOSITORY_TOKEN } from '../../../domain/repositoty-interface';
import { IPostValidator, POST_VALIDATOR_TOKEN } from '../../../domain/validator/interface';
import {
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../../../v2-group/application';
import { PostEntity } from '../../../domain/model/content';
import { IUserApplicationService, USER_APPLICATION_TOKEN } from '../../../../v2-user/application';
import { MediaService } from '../../../../media';
import { MediaMarkAction, MediaType } from '../../../../../database/models/media.model';
import { KAFKA_PRODUCER, PostHasBeenPublished } from '../../../../../common/constants';
import { ClientKafka } from '@nestjs/microservices';
import { NotificationService } from '../../../../../notification';
import { PostActivityService } from '../../../../../notification/activities';
import { CONTENT_BINDING_TOKEN } from '../../binding/binding-post/content.interface';
import { ContentBinding } from '../../binding/binding-post/content.binding';
import { SeriesAddedItemsEvent } from '../../../../../events/series';
import { InternalEventEmitterService } from '../../../../../app/custom/event-emitter';

@CommandHandler(ProcessPostPublishedCommand)
export class ProcessPostPublishedHandler
  implements ICommandHandler<ProcessPostPublishedCommand, void>
{
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN) private readonly _postRepository: IContentRepository,
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

  public async execute(command: ProcessPostPublishedCommand): Promise<void> {
    const { before, after } = command.payload;

    const postEntity = await this._postRepository.findOne({
      where: {
        id: after.id,
        groupArchived: false,
      },
      include: {
        shouldIncludeGroup: true,
        shouldIncludeSeries: true,
        shouldIncludeTag: true,
        shouldIncludeLinkPreview: true,
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
    postEntity: PostEntity
  ): Promise<void> {
    const { before, after, isPublished } = command.payload;

    let series = [];
    if (postEntity.get('seriesIds')?.length) {
      series = await this._postRepository.findAll({
        attributes: ['id', 'createdBy'], //TODO enhance get attributes repo
        where: {
          ids: after.seriesIds,
        },
      });
    }
    const groups = await this._groupApplicationService.findAllByIds(postEntity.get('groupIds'));
    const mentionUsers = await this._userApplicationService.findAllByIds(
      postEntity.get('mentionUserIds')
    );
    const updatedActivity = this._postActivityService.createPayload({
      id: postEntity.get('id'),
      title: null,
      content: postEntity.get('content'),
      contentType: postEntity.get('type'),
      setting: postEntity.get('setting'),
      audience: {
        groups,
      },
      mentions: this._contentBinding.mapMentionWithUserInfo(mentionUsers) as any,
      actor: after.actor,
      createdAt: after.createdAt,
    });

    await this._notificationService.publishPostNotification({
      key: after.id,
      value: {
        actor: {
          id: after.actor.id,
        },
        event: PostHasBeenPublished,
        data: updatedActivity,
        meta: {
          post: {
            ignoreUserIds: series.map((series) => series.get('createdBy')),
          },
        },
      },
    });

    for (const sr of series) {
      this._internalEventEmitter.emit(
        new SeriesAddedItemsEvent({
          itemIds: [after.id],
          seriesId: sr.get('id'),
          actor: after.actor,
          context: 'publish',
        })
      );
    }
  }

  private async _processMedia(postEntity: PostEntity): Promise<void> {
    const videoIds = postEntity.get('media').videos.map((video) => video.get('id'));
    const fileIds = postEntity.get('media').files.map((file) => file.get('id'));
    if (videoIds.length) {
      await this._mediaService.emitMediaToUploadService(
        MediaType.VIDEO,
        MediaMarkAction.USED,
        videoIds,
        postEntity.get('createdBy')
      );
    }
    if (fileIds.length) {
      await this._mediaService.emitMediaToUploadService(
        MediaType.FILE,
        MediaMarkAction.USED,
        fileIds,
        postEntity.get('createdBy')
      );
    }
  }
}
