import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  IPostDomainService,
  POST_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { ProcessPostPublishedCommand } from './process-post-published.command';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import {
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../../../v2-group/application';
import { PostEntity } from '../../../domain/model/content';
import { IUserApplicationService, USER_APPLICATION_TOKEN } from '../../../../v2-user/application';
import { MediaType } from '../../../../../database/models/media.model';
import { PostHasBeenPublished } from '../../../../../common/constants';
import { NotificationService } from '../../../../../notification';
import { PostActivityService } from '../../../../../notification/activities';
import { CONTENT_BINDING_TOKEN } from '../../binding/binding-post/content.interface';
import { ContentBinding } from '../../binding/binding-post/content.binding';
import { SeriesAddedItemsEvent } from '../../../../../events/series';
import { InternalEventEmitterService } from '../../../../../app/custom/event-emitter';
import {
  IMediaDomainService,
  MEDIA_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface/media.domain-service.interface';

@CommandHandler(ProcessPostPublishedCommand)
export class ProcessPostPublishedHandler
  implements ICommandHandler<ProcessPostPublishedCommand, void>
{
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN) private readonly _contentRepository: IContentRepository,
    @Inject(POST_DOMAIN_SERVICE_TOKEN) private readonly _postDomainService: IPostDomainService,
    @Inject(GROUP_APPLICATION_TOKEN)
    private readonly _groupApplicationService: IGroupApplicationService,
    @Inject(USER_APPLICATION_TOKEN)
    private readonly _userApplicationService: IUserApplicationService,
    @Inject(CONTENT_BINDING_TOKEN) private readonly _contentBinding: ContentBinding,
    @Inject(MEDIA_DOMAIN_SERVICE_TOKEN) private readonly _mediaDomainService: IMediaDomainService,
    private readonly _notificationService: NotificationService, //TODO improve interface later
    private readonly _postActivityService: PostActivityService, //TODO improve interface later
    private readonly _internalEventEmitter: InternalEventEmitterService //TODO improve interface later
  ) {}

  public async execute(command: ProcessPostPublishedCommand): Promise<void> {
    const { after } = command.payload;

    const postEntity = await this._contentRepository.findOne({
      where: {
        id: after.id,
        groupArchived: false,
      },
      include: {
        shouldIncludeGroup: true,
        shouldIncludeSeries: true,
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
    const { after } = command.payload;

    let series = [];
    if (postEntity.get('seriesIds')?.length) {
      series = await this._contentRepository.findAll({
        attributes: {
          exclude: ['content'],
        },
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
      await this._mediaDomainService.setMediaUsed(
        MediaType.VIDEO,
        videoIds,
        postEntity.get('createdBy')
      );
    }
    if (fileIds.length) {
      await this._mediaDomainService.setMediaUsed(
        MediaType.FILE,
        fileIds,
        postEntity.get('createdBy')
      );
    }
  }
}
