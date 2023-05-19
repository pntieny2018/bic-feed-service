import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  IPostDomainService,
  POST_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { PublishPostCommand } from './publish-post.command';
import { IPostRepository, POST_REPOSITORY_TOKEN } from '../../../domain/repositoty-interface';
import { IPostValidator, POST_VALIDATOR_TOKEN } from '../../../domain/validator/interface';
import {
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../../../v2-group/application';
import { ContentNotFoundException } from '../../../domain/exception';
import { PostEntity } from '../../../domain/model/content';
import { PostDto } from '../../dto';
import { IUserApplicationService, USER_APPLICATION_TOKEN } from '../../../../v2-user/application';
import { ContentBinding } from '../../binding/binding-post/content.binding';
import { CONTENT_BINDING_TOKEN } from '../../binding/binding-post/content.interface';
import { KAFKA_PRODUCER, KAFKA_TOPIC } from '../../../../../common/constants';
import { ClientKafka } from '@nestjs/microservices';
import { PostChangedMessagePayload } from '../../dto/message/post-published.message-payload';
import { MediaService } from '../../../../media';

@CommandHandler(PublishPostCommand)
export class PublishPostHandler implements ICommandHandler<PublishPostCommand, PostDto> {
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
    private readonly _mediaService: MediaService
  ) {}

  public async execute(command: PublishPostCommand): Promise<PostDto> {
    const { authUser, id, groupIds, mentionUserIds } = command.payload;
    const postEntity = await this._postRepository.findOne({
      where: {
        id,
        groupArchived: false,
      },
      include: {
        shouldIncludeGroup: true,
        shouldIncludeSeries: true,
        shouldIncludeTag: true,
        shouldIncludeLinkPreview: true,
      },
    });
    if (!postEntity || !(postEntity instanceof PostEntity)) {
      throw new ContentNotFoundException();
    }

    const postPropsBefore = { ...postEntity.toObject() };
    const groups = await this._groupApplicationService.findAllByIds(
      groupIds || postEntity.get('groupIds')
    );
    const mentionUsers = await this._userApplicationService.findAllByIds(mentionUserIds, {
      withGroupJoined: true,
    });

    await this._postDomainService.publishPost({
      postEntity: postEntity as PostEntity,
      newData: {
        ...command.payload,
        mentionUsers,
        groups,
      },
    });

    await this._postDomainService.markSeen(postEntity, authUser.id);

    const result = await this._contentBinding.postBinding(postEntity, {
      groups,
      // actor: TODO hide authUser, because actor is returning permission property, transform GROUP not work, check later
      mentionUsers,
    });

    //TODO:: wrap event
    if (postEntity.isChanged() && postEntity.isPublished()) {
      const payload = {
        isPublished: postEntity.getState().isChangeStatus,
        before: {
          id: postPropsBefore.id,
          actor: result.actor,
          setting: postPropsBefore.setting,
          type: postPropsBefore.type,
          groupIds: postPropsBefore.groupIds,
          content: postPropsBefore.content,
          mentionUserIds: postPropsBefore.mentionUserIds,
          createdAt: postPropsBefore.createdAt,
          updatedAt: postPropsBefore.updatedAt,
          lang: postPropsBefore.lang,
          isHidden: postPropsBefore.isHidden,
          status: postPropsBefore.status,
        },
        after: {
          id: postEntity.get('id'),
          actor: result.actor,
          setting: result.setting,
          type: result.type,
          groupIds: postEntity.get('groupIds'),
          communityIds: result.communities.map((community) => community.id),
          tags: result.tags,
          media: result.media,
          seriesIds: result.series,
          content: result.content,
          mentionUserIds: postEntity.get('mentionUserIds'),
          lang: postEntity.get('lang'),
          isHidden: postEntity.get('isHidden'),
          status: postEntity.get('status'),
          state: {
            attachSeriesIds: postEntity.getState().attachSeriesIds,
            detachSeriesIds: postEntity.getState().detachSeriesIds,
            attachGroupIds: postEntity.getState().attachGroupIds,
            detachGroupIds: postEntity.getState().detachGroupIds,
            attachTagIds: postEntity.getState().attachTagIds,
            detachTagIds: postEntity.getState().detachTagIds,
            attachFileIds: postEntity.getState().attachFileIds,
            detachFileIds: postEntity.getState().detachFileIds,
            attachImageIds: postEntity.getState().attachImageIds,
            detachImageIds: postEntity.getState().detachImageIds,
            attachVideoIds: postEntity.getState().attachVideoIds,
            detachVideoIds: postEntity.getState().detachVideoIds,
          },
          createdAt: result.createdAt,
          updatedAt: result.updatedAt,
        },
      };
      await this._clientKafka.emit(KAFKA_TOPIC.CONTENT.POST_CHANGED, {
        key: postEntity.get('id'),
        value: JSON.stringify(new PostChangedMessagePayload(payload)),
      });
    }

    return result;
  }
}
