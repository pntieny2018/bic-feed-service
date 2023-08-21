import { KafkaService } from '@app/kafka';
import { KAFKA_TOPIC } from '@app/kafka/kafka.constant';
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { cloneDeep, uniq } from 'lodash';

import { MediaService } from '../../../../../media';
import {
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../../../../v2-group/application';
import {
  IUserApplicationService,
  USER_APPLICATION_TOKEN,
} from '../../../../../v2-user/application';
import {
  IPostDomainService,
  POST_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import {
  ContentNoPublishYetException,
  ContentNotFoundException,
} from '../../../../domain/exception';
import { PostEntity } from '../../../../domain/model/content';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
} from '../../../../domain/repositoty-interface';
import { IPostValidator, POST_VALIDATOR_TOKEN } from '../../../../domain/validator/interface';
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
    @Inject(GROUP_APPLICATION_TOKEN)
    private readonly _groupApplicationService: IGroupApplicationService,
    @Inject(USER_APPLICATION_TOKEN)
    private readonly _userApplicationService: IUserApplicationService,
    @Inject(POST_VALIDATOR_TOKEN) private readonly _postValidator: IPostValidator,
    @Inject(CONTENT_BINDING_TOKEN) private readonly _contentBinding: ContentBinding,
    private readonly _kafkaService: KafkaService,
    private readonly _mediaService: MediaService
  ) {}

  public async execute(command: UpdatePostCommand): Promise<PostDto> {
    const { authUser, id, groupIds, mentionUserIds } = command.payload;
    const postEntity = await this._contentRepository.findOne({
      where: {
        id,
        groupArchived: false,
      },
      include: {
        shouldIncludeGroup: true,
        shouldIncludeSeries: true,
        shouldIncludeLinkPreview: true,
        shouldIncludeQuiz: true,
        shouldIncludeMarkReadImportant: {
          userId: authUser?.id,
        },
      },
    });
    if (
      !postEntity ||
      postEntity.isHidden() ||
      !(postEntity instanceof PostEntity) ||
      postEntity.isInArchivedGroups()
    ) {
      throw new ContentNotFoundException();
    }

    if (!postEntity.isPublished()) {
      throw new ContentNoPublishYetException();
    }

    const postEntityBefore = cloneDeep(postEntity);
    const groups = await this._groupApplicationService.findAllByIds(
      groupIds || postEntity.get('groupIds')
    );
    const mentionUsers = await this._userApplicationService.findAllByIds(mentionUserIds, {
      withGroupJoined: true,
    });

    await this._postDomainService.updatePost({
      postEntity: postEntity as PostEntity,
      newData: {
        ...command.payload,
        mentionUsers,
        groups,
      },
    });

    if (postEntity.isImportant()) {
      await this._postDomainService.markReadImportant(postEntity.get('id'), authUser.id);
      postEntity.setMarkReadImportant();
    }

    const result = await this._contentBinding.postBinding(postEntity, {
      groups,
      actor: authUser,
      authUser,
      mentionUsers,
    });

    await this._sendEvent(postEntityBefore, postEntity, result);

    return result;
  }

  private async _sendEvent(
    postEntityBefore: PostEntity,
    postEntityAfter: PostEntity,
    result: PostDto
  ): Promise<void> {
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
          id: postEntityBefore.getId(),
          actor: result.actor,
          setting: postEntityBefore.get('setting'),
          type: postEntityBefore.get('type'),
          groupIds: postEntityBefore.get('groupIds'),
          content: postEntityBefore.get('content'),
          mentionUserIds: postEntityBefore.get('mentionUserIds'),
          createdAt: postEntityBefore.get('createdAt'),
          updatedAt: postEntityBefore.get('updatedAt'),
          lang: postEntityBefore.get('lang'),
          isHidden: postEntityBefore.get('isHidden'),
          status: postEntityBefore.get('status'),
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

      this._kafkaService.emit(KAFKA_TOPIC.CONTENT.POST_CHANGED, {
        key: postEntityAfter.getId(),
        value: new PostChangedMessagePayload(payload),
      });
    }

    if (postEntityAfter.isProcessing() && postEntityAfter.getVideoIdProcessing()) {
      this._kafkaService.emit(KAFKA_TOPIC.STREAM.VIDEO_POST_PUBLIC, {
        key: null,
        value: { videoIds: [postEntityAfter.getVideoIdProcessing()] },
      });
    }
  }
}
