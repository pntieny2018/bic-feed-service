import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { uniq } from 'lodash';

import { KAFKA_TOPIC } from '../../../../../../common/constants';
import {
  IUserApplicationService,
  USER_APPLICATION_TOKEN,
} from '../../../../../v2-user/application';
import {
  IPostDomainService,
  POST_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import { IKafkaAdapter, KAFKA_ADAPTER } from '../../../../domain/infra-adapter-interface';
import { PostEntity } from '../../../../domain/model/content';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
} from '../../../../domain/repositoty-interface';
import {
  GROUP_ADAPTER,
  IGroupAdapter,
} from '../../../../domain/service-adapter-interface /group-adapter.interface';
import { ContentBinding } from '../../../binding/binding-post/content.binding';
import { CONTENT_BINDING_TOKEN } from '../../../binding/binding-post/content.interface';
import { PostDto } from '../../../dto';
import { PostChangedMessagePayload } from '../../../dto/message';

import { UpdatePostCommand } from './update-post.command';

@CommandHandler(UpdatePostCommand)
export class UpdatePostHandler implements ICommandHandler<UpdatePostCommand, PostDto> {
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN) private readonly _contentRepository: IContentRepository,
    @Inject(POST_DOMAIN_SERVICE_TOKEN) private readonly _postDomainService: IPostDomainService,
    @Inject(CONTENT_BINDING_TOKEN) private readonly _contentBinding: ContentBinding,
    @Inject(GROUP_ADAPTER)
    private readonly _groupAdapter: IGroupAdapter,
    @Inject(USER_APPLICATION_TOKEN)
    private readonly _userApplicationService: IUserApplicationService,
    @Inject(KAFKA_ADAPTER)
    private readonly _kafkaAdapter: IKafkaAdapter
  ) {}

  public async execute(command: UpdatePostCommand): Promise<PostDto> {
    const postEntity = await this._postDomainService.updatePost(command.payload);

    if (postEntity.isImportant()) {
      await this._postDomainService.markReadImportant(
        postEntity.get('id'),
        command.payload.authUser.id
      );
      postEntity.setMarkReadImportant();
    }

    const groups = await this._groupAdapter.getGroupsByIds(
      command.payload?.groupIds || postEntity.get('groupIds')
    );
    const mentionUsers = await this._userApplicationService.findAllByIds(
      command.payload.mentionUserIds,
      {
        withGroupJoined: true,
      }
    );

    const result = await this._contentBinding.postBinding(postEntity, {
      groups,
      actor: command.payload.authUser,
      authUser: command.payload.authUser,
      mentionUsers,
    });
    await this._sendEvent(postEntity, result);
    return result;
  }

  private async _sendEvent(postEntityAfter: PostEntity, result: PostDto): Promise<void> {
    const postBefore = postEntityAfter.getSnapshot();
    if (!postEntityAfter.isChanged()) {
      return;
    }
    if (postEntityAfter.isPublished()) {
      const contentWithArchivedGroups = (await this._contentRepository.findOne({
        where: {
          id: postEntityAfter.getId(),
          groupArchived: true,
        },
        include: {
          shouldIncludeSeries: true,
        },
      })) as PostEntity;

      const seriesIds = uniq([
        ...postEntityAfter.getSeriesIds(),
        ...(contentWithArchivedGroups ? contentWithArchivedGroups?.getSeriesIds() : []),
      ]);

      const payload: PostChangedMessagePayload = {
        state: 'update',
        before: {
          id: postBefore.id,
          actor: result.actor,
          setting: postBefore.setting,
          type: postBefore.type,
          groupIds: postBefore.groupIds,
          content: postBefore.content,
          mentionUserIds: postBefore.mentionUserIds,
          createdAt: postBefore.createdAt,
          updatedAt: postBefore.updatedAt,
          lang: postBefore.lang,
          isHidden: postBefore.isHidden,
          status: postBefore.status,
        },
        after: {
          id: postEntityAfter.get('id'),
          actor: result.actor,
          setting: result.setting,
          type: result.type,
          groupIds: postEntityAfter.get('groupIds'),
          communityIds: result.communities.map((community) => community.id),
          tags: result.tags,
          media: result.media,
          seriesIds,
          content: postEntityAfter.get('content'),
          mentionUserIds: postEntityAfter.get('mentionUserIds'),
          lang: postEntityAfter.get('lang'),
          isHidden: postEntityAfter.get('isHidden'),
          status: postEntityAfter.get('status'),
          state: {
            attachSeriesIds: postEntityAfter.getState().attachSeriesIds,
            detachSeriesIds: postEntityAfter.getState().detachSeriesIds,
            attachGroupIds: postEntityAfter.getState().attachGroupIds,
            detachGroupIds: postEntityAfter.getState().detachGroupIds,
            attachTagIds: postEntityAfter.getState().attachTagIds,
            detachTagIds: postEntityAfter.getState().detachTagIds,
            attachFileIds: postEntityAfter.getState().attachFileIds,
            detachFileIds: postEntityAfter.getState().detachFileIds,
            attachImageIds: postEntityAfter.getState().attachImageIds,
            detachImageIds: postEntityAfter.getState().detachImageIds,
            attachVideoIds: postEntityAfter.getState().attachVideoIds,
            detachVideoIds: postEntityAfter.getState().detachVideoIds,
          },
          createdAt: postEntityAfter.get('createdAt'),
          updatedAt: postEntityAfter.get('updatedAt'),
          publishedAt: postEntityAfter.get('publishedAt'),
        },
      };

      this._kafkaAdapter.emit(KAFKA_TOPIC.CONTENT.POST_CHANGED, {
        key: postEntityAfter.getId(),
        value: new PostChangedMessagePayload(payload),
      });
    }

    if (postEntityAfter.isProcessing() && postEntityAfter.getVideoIdProcessing()) {
      this._kafkaAdapter.emit(KAFKA_TOPIC.STREAM.VIDEO_POST_PUBLIC, {
        key: null,
        value: { videoIds: [postEntityAfter.getVideoIdProcessing()] },
      });
    }
  }
}
