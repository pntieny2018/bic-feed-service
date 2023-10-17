import { UserDto } from '@libs/service/user';
import { Inject, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';

import { DatabaseException } from '../../../../common/exceptions';
import { LinkPreviewDto, MediaDto } from '../../application/dto';
import {
  ContentHasSeenEvent,
  PostDeletedEvent,
  PostPublishedEvent,
  PostScheduledEvent,
} from '../event';
import {
  ContentAccessDeniedException,
  ContentHasBeenPublishedException,
  ContentNoPublishYetException,
  ContentNotFoundException,
  InvalidResourceImageException,
  PostVideoProcessingException,
} from '../exception';
import { PostEntity } from '../model/content';
import {
  IContentRepository,
  ITagRepository,
  CONTENT_REPOSITORY_TOKEN,
  TAG_REPOSITORY_TOKEN,
} from '../repositoty-interface';
import {
  GROUP_ADAPTER,
  IGroupAdapter,
  IUserAdapter,
  USER_ADAPTER,
} from '../service-adapter-interface';
import {
  CONTENT_VALIDATOR_TOKEN,
  IContentValidator,
  IMentionValidator,
  IPostValidator,
  MENTION_VALIDATOR_TOKEN,
  POST_VALIDATOR_TOKEN,
} from '../validator/interface';

import {
  IPostDomainService,
  PostCreateProps,
  PostPayload,
  PublishPostProps,
  SchedulePostProps,
  UpdatePostProps,
  ILinkPreviewDomainService,
  LINK_PREVIEW_DOMAIN_SERVICE_TOKEN,
  IMediaDomainService,
  MEDIA_DOMAIN_SERVICE_TOKEN,
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from './interface';

export class PostDomainService implements IPostDomainService {
  private readonly _logger = new Logger(PostDomainService.name);

  public constructor(
    @Inject(LINK_PREVIEW_DOMAIN_SERVICE_TOKEN)
    private readonly _linkPreviewDomainService: ILinkPreviewDomainService,
    @Inject(MEDIA_DOMAIN_SERVICE_TOKEN)
    private readonly _mediaDomainService: IMediaDomainService,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService,

    @Inject(POST_VALIDATOR_TOKEN)
    private readonly _postValidator: IPostValidator,
    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator,
    @Inject(MENTION_VALIDATOR_TOKEN)
    private readonly _mentionValidator: IMentionValidator,

    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(TAG_REPOSITORY_TOKEN)
    private readonly _tagRepo: ITagRepository,

    @Inject(GROUP_ADAPTER)
    private readonly _groupAdapter: IGroupAdapter,
    @Inject(USER_ADAPTER)
    private readonly _userAdapter: IUserAdapter,

    private readonly event: EventBus
  ) {}

  public async getPostById(postId: string, authUserId: string): Promise<PostEntity> {
    const postEntity = await this._contentRepository.findOne({
      where: {
        id: postId,
        groupArchived: false,
        excludeReportedByUserId: authUserId,
      },
      include: {
        shouldIncludeGroup: true,
        shouldIncludeSeries: true,
        shouldIncludeLinkPreview: true,
        shouldIncludeQuiz: true,
        shouldIncludeSaved: {
          userId: authUserId,
        },
        shouldIncludeMarkReadImportant: {
          userId: authUserId,
        },
        shouldIncludeReaction: {
          userId: authUserId,
        },
      },
    });

    if (
      !postEntity ||
      !(postEntity instanceof PostEntity) ||
      (postEntity.isDraft() && !postEntity.isOwner(authUserId)) ||
      (postEntity.isHidden() && !postEntity.isOwner(authUserId)) ||
      postEntity.isInArchivedGroups()
    ) {
      throw new ContentNotFoundException();
    }

    if (!authUserId && !postEntity.isOpen()) {
      throw new ContentAccessDeniedException();
    }

    if (postEntity.isPublished()) {
      this.event.publish(new ContentHasSeenEvent({ contentId: postId, userId: authUserId }));
    }

    return postEntity;
  }

  public async createDraftPost(input: PostCreateProps): Promise<PostEntity> {
    const { groups, userId } = input;

    const postEntity = PostEntity.create({
      groupIds: [],
      userId,
    });

    postEntity.setGroups(groups.map((group) => group.id));
    postEntity.setPrivacyFromGroups(groups);
    try {
      await this._contentRepository.create(postEntity);
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
    return postEntity;
  }

  public async schedule(input: SchedulePostProps): Promise<PostEntity> {
    const { payload, actor } = input;
    const { id, scheduledAt } = payload;

    const postEntity = await this._contentRepository.findContentByIdInActiveGroup(id, {
      mustIncludeGroup: true,
      shouldIncludeSeries: true,
      shouldIncludeLinkPreview: true,
    });

    const isPost = postEntity && postEntity instanceof PostEntity;
    if (!isPost || postEntity.isHidden()) {
      throw new ContentNotFoundException();
    }

    if (postEntity.isPublished()) {
      throw new ContentHasBeenPublishedException();
    }

    await this._validateAndSetPostAttributes(postEntity, payload, actor);

    postEntity.setWaitingSchedule(scheduledAt);

    if (postEntity.isChanged()) {
      await this._contentRepository.update(postEntity);
      this.event.publish(new PostScheduledEvent({ postEntity, actor }));
    }

    return postEntity;
  }

  public async publish(input: PublishPostProps): Promise<PostEntity> {
    const { payload, actor } = input;
    const { id: postId } = payload;

    const postEntity = await this._contentRepository.findContentByIdInActiveGroup(postId, {
      mustIncludeGroup: true,
      shouldIncludeSeries: true,
      shouldIncludeLinkPreview: true,
    });

    const isPost = postEntity && postEntity instanceof PostEntity;
    if (!isPost || postEntity.isHidden()) {
      throw new ContentNotFoundException();
    }

    if (postEntity.isPublished()) {
      return postEntity;
    }

    await this._validateAndSetPostAttributes(postEntity, payload, actor);

    if (postEntity.isWaitingSchedule() && postEntity.hasVideoProcessing()) {
      throw new PostVideoProcessingException();
    }

    if (postEntity.hasVideoProcessing()) {
      postEntity.setProcessing();
    } else {
      postEntity.setPublish();
    }

    if (postEntity.isChanged()) {
      await this._contentRepository.update(postEntity);

      if (postEntity.getState().isChangeStatus && postEntity.isNotUsersSeen()) {
        await this._contentDomainService.markSeen(postId, actor.id);
        postEntity.increaseTotalSeen();
      }

      if (postEntity.isImportant()) {
        await this._contentDomainService.markReadImportant(postId, actor.id);
        postEntity.setMarkReadImportant();
      }

      this.event.publish(new PostPublishedEvent({ postEntity, actor }));
    }

    return postEntity;
  }

  public async updatePost(props: UpdatePostProps): Promise<PostEntity> {
    const { id } = props.payload;
    const authUser = props.authUser;

    const postEntity = await this._contentRepository.findContentByIdInActiveGroup(id, {
      shouldIncludeGroup: true,
      shouldIncludeSeries: true,
      shouldIncludeLinkPreview: true,
      shouldIncludeQuiz: true,
      shouldIncludeMarkReadImportant: {
        userId: authUser?.id,
      },
      shouldIncludeReaction: {
        userId: authUser?.id,
      },
    });

    if (
      !postEntity ||
      (postEntity.isHidden() && !postEntity.isOwner(authUser.id)) ||
      !(postEntity instanceof PostEntity) ||
      postEntity.isInArchivedGroups()
    ) {
      throw new ContentNotFoundException();
    }

    if (postEntity.isDraft()) {
      throw new ContentNoPublishYetException();
    }

    await this._validateAndSetPostAttributes(postEntity, props.payload, authUser);

    if (postEntity.hasVideoProcessing()) {
      postEntity.setProcessing();
    }

    if (!postEntity.isChanged()) {
      return;
    }
    await this._contentRepository.update(postEntity);
    return postEntity;
  }

  public async autoSavePost(props: UpdatePostProps): Promise<void> {
    const { id } = props.payload;
    const authUser = props.authUser;

    const postEntity = await this._contentRepository.findContentByIdInActiveGroup(id, {
      shouldIncludeGroup: true,
      shouldIncludeSeries: true,
      shouldIncludeLinkPreview: true,
    });

    if (
      !postEntity ||
      !(postEntity instanceof PostEntity) ||
      postEntity.isHidden() ||
      postEntity.isPublished()
    ) {
      return;
    }

    await this._validateAndSetPostAttributes(postEntity, props.payload, authUser, false);
    if (!postEntity.isChanged()) {
      return;
    }
    return this._contentRepository.update(postEntity);
  }

  public async delete(id: string, authUser: UserDto): Promise<void> {
    const postEntity = await this._contentRepository.findContentByIdInActiveGroup(id, {
      shouldIncludeGroup: true,
      shouldIncludeSeries: true,
    });

    if (!postEntity || !(postEntity instanceof PostEntity)) {
      throw new ContentNotFoundException();
    }

    if (!postEntity.isOwner(authUser.id)) {
      throw new ContentAccessDeniedException();
    }

    if (postEntity.isPublished()) {
      await this._contentValidator.checkCanCRUDContent(
        authUser,
        postEntity.get('groupIds'),
        postEntity.get('type')
      );
    }

    await this._contentRepository.delete(id);
    this.event.publish(new PostDeletedEvent({ postEntity, actor: authUser }));
  }

  private async _validateAndSetPostAttributes(
    postEntity: PostEntity,
    payload: PostPayload,
    actor: UserDto,
    validatePublishContent = true
  ): Promise<void> {
    const { content, seriesIds, tagIds, groupIds, media, mentionUserIds, linkPreview } = payload;

    if (tagIds) {
      await this._setNewTags(postEntity, tagIds);
    }

    if (media) {
      await this._setNewMedia(postEntity, media);
    }

    const currentLinkPreviewUrl = postEntity.get('linkPreview')?.get('url');
    if (linkPreview && linkPreview.url !== currentLinkPreviewUrl) {
      await this._setNewLinkPreview(postEntity, linkPreview);
    }

    const groups = await this._groupAdapter.getGroupsByIds(groupIds || postEntity.get('groupIds'));
    const mentionUsers = await this._userAdapter.getUsersByIds(mentionUserIds || [], {
      withGroupJoined: true,
    });

    postEntity.updateAttribute({ content, seriesIds, groupIds, mentionUserIds }, actor.id);
    postEntity.setPrivacyFromGroups(groups);

    validatePublishContent &&
      (await this._postValidator.validatePublishContent(
        postEntity,
        actor,
        postEntity.get('groupIds')
      ));
    await this._mentionValidator.validateMentionUsers(mentionUsers, groups);
    await this._postValidator.validateLimitedToAttachSeries(postEntity);
    await this._contentValidator.validateSeriesAndTags(
      groups,
      postEntity.get('seriesIds'),
      postEntity.get('tags')
    );
  }

  private async _setNewTags(postEntity: PostEntity, tagIds: string[]): Promise<void> {
    const newTagEntities = await this._tagRepo.findAll({
      ids: tagIds,
    });
    postEntity.setTags(newTagEntities);
  }

  private async _setNewLinkPreview(
    postEntity: PostEntity,
    linkPreview: LinkPreviewDto
  ): Promise<void> {
    const linkPreviewEntity = await this._linkPreviewDomainService.findOrUpsert(linkPreview);
    postEntity.setLinkPreview(linkPreviewEntity);
  }

  private async _setNewMedia(postEntity: PostEntity, media: MediaDto): Promise<void> {
    const ownerId = postEntity.get('createdBy');

    const imageEntities = postEntity.get('media').images;
    const fileEntities = postEntity.get('media').files;
    const videoEntities = postEntity.get('media').videos;

    const newImageIds = media?.images?.map((image) => image.id) || [];
    const newFileIds = media?.files?.map((file) => file.id) || [];
    const newVideoIds = media?.videos?.map((video) => video.id) || [];

    const images = await this._mediaDomainService.getAvailableImages(
      imageEntities,
      newImageIds,
      ownerId
    );
    if (images.some((image) => !image.isPostContentResource())) {
      throw new InvalidResourceImageException();
    }
    const files = await this._mediaDomainService.getAvailableFiles(
      fileEntities,
      newFileIds,
      ownerId
    );
    const videos = await this._mediaDomainService.getAvailableVideos(
      videoEntities,
      newVideoIds,
      ownerId
    );

    postEntity.setMedia({
      files,
      images,
      videos,
    });
  }
}
