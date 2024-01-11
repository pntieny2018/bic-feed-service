import { CONTENT_STATUS } from '@beincom/constants';
import { GroupDto } from '@libs/service/group';
import { UserDto } from '@libs/service/user';
import { Inject, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';

import { DatabaseException } from '../../../../common/exceptions';
import { LinkPreviewDto, MediaRequestDto } from '../../application/dto';
import {
  ContentGetDetailEvent,
  PostDeletedEvent,
  PostPublishedEvent,
  PostScheduledEvent,
  PostUpdatedEvent,
  PostVideoFailedEvent,
  PostVideoSuccessEvent,
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
  UpdateVideoProcessProps,
} from './interface';

export class PostDomainService implements IPostDomainService {
  private readonly _logger = new Logger(PostDomainService.name);

  public constructor(
    @Inject(LINK_PREVIEW_DOMAIN_SERVICE_TOKEN)
    private readonly _linkPreviewDomain: ILinkPreviewDomainService,
    @Inject(MEDIA_DOMAIN_SERVICE_TOKEN)
    private readonly _mediaDomain: IMediaDomainService,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomain: IContentDomainService,

    @Inject(POST_VALIDATOR_TOKEN)
    private readonly _postValidator: IPostValidator,
    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator,
    @Inject(MENTION_VALIDATOR_TOKEN)
    private readonly _mentionValidator: IMentionValidator,

    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepo: IContentRepository,
    @Inject(TAG_REPOSITORY_TOKEN)
    private readonly _tagRepo: ITagRepository,

    @Inject(GROUP_ADAPTER)
    private readonly _groupAdapter: IGroupAdapter,
    @Inject(USER_ADAPTER)
    private readonly _userAdapter: IUserAdapter,

    private readonly event: EventBus
  ) {}

  public async getPostById(postId: string, authUser: UserDto): Promise<PostEntity> {
    const postEntity = await this._contentRepo.findContentWithCache({
      where: {
        id: postId,
        excludeReportedByUserId: authUser.id,
      },
      include: {
        shouldIncludeGroup: true,
        shouldIncludeSeries: true,
        shouldIncludeLinkPreview: true,
        shouldIncludeQuiz: true,
      },
    });

    const isPost = postEntity && postEntity instanceof PostEntity;
    if (!isPost || postEntity.isInArchivedGroups()) {
      throw new ContentNotFoundException();
    }

    await this._contentValidator.checkCanReadNotPublishedContent(postEntity, authUser.id);

    if (!authUser.id && !postEntity.isOpen()) {
      throw new ContentAccessDeniedException();
    }

    if (postEntity.isPublished()) {
      this.event.publish(new ContentGetDetailEvent({ contentId: postId, userId: authUser.id }));
    }

    return postEntity;
  }

  public async createDraftPost(input: PostCreateProps): Promise<PostEntity> {
    const { groups, userId } = input;

    const postEntity = PostEntity.create(userId);

    postEntity.setGroups(groups.map((group) => group.id));
    postEntity.setPrivacyFromGroups(groups);
    try {
      await this._contentRepo.create(postEntity);
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
    return postEntity;
  }

  public async schedule(input: SchedulePostProps): Promise<PostEntity> {
    const { payload, actor } = input;
    const { id, scheduledAt, groupIds } = payload;

    const postEntity = await this._contentRepo.findContentWithCache({
      where: { id },
      include: {
        mustIncludeGroup: true,
        shouldIncludeSeries: true,
        shouldIncludeLinkPreview: true,
      },
    });

    const isPost = postEntity && postEntity instanceof PostEntity;
    if (!isPost || postEntity.isHidden()) {
      throw new ContentNotFoundException();
    }

    if (postEntity.isPublished()) {
      throw new ContentHasBeenPublishedException();
    }
    const groups = await this._groupAdapter.getGroupsByIds(groupIds || postEntity.get('groupIds'));

    await this._setPostAttributes(postEntity, groups, payload, actor);
    await this._validatePost(postEntity, groups, payload, actor);

    postEntity.setWaitingSchedule(scheduledAt);

    if (postEntity.isChanged()) {
      await this._contentRepo.update(postEntity);
      this.event.publish(new PostScheduledEvent({ entity: postEntity, authUser: actor }));
    }

    return postEntity;
  }

  public async publish(input: PublishPostProps): Promise<PostEntity> {
    const { payload, actor } = input;
    const { id: postId, groupIds } = payload;

    const postEntity = await this._contentRepo.findContentWithCache({
      where: { id: postId },
      include: {
        mustIncludeGroup: true,
        shouldIncludeSeries: true,
        shouldIncludeLinkPreview: true,
      },
    });

    const isPost = postEntity && postEntity instanceof PostEntity;
    if (!isPost || postEntity.isHidden()) {
      throw new ContentNotFoundException();
    }

    if (postEntity.isPublished()) {
      return postEntity;
    }
    const groups = await this._groupAdapter.getGroupsByIds(groupIds || postEntity.get('groupIds'));

    await this._setPostAttributes(postEntity, groups, payload, actor);
    await this._validatePost(postEntity, groups, payload, actor);

    if (postEntity.isWaitingSchedule() && postEntity.hasVideoProcessing()) {
      throw new PostVideoProcessingException();
    }

    if (postEntity.hasVideoProcessing()) {
      postEntity.setProcessing();
    } else {
      postEntity.setPublish();
    }

    if (postEntity.isChanged()) {
      await this._contentRepo.update(postEntity);

      if (postEntity.isNotUsersSeen()) {
        await this._contentDomain.markSeen(postId, actor.id);
        postEntity.increaseTotalSeen();
      }

      if (postEntity.isImportant()) {
        await this._contentDomain.markReadImportant(postId, actor.id);
        postEntity.setMarkReadImportant();
      }

      this.event.publish(new PostPublishedEvent({ entity: postEntity, authUser: actor }));
    }

    return postEntity;
  }

  public async update(props: UpdatePostProps): Promise<PostEntity> {
    const { payload, actor } = props;

    const postEntity = await this._contentRepo.findContentByIdInActiveGroup(payload.id, {
      shouldIncludeGroup: true,
      shouldIncludeSeries: true,
      shouldIncludeLinkPreview: true,
      shouldIncludeQuiz: true,
      shouldIncludeMarkReadImportant: {
        userId: actor?.id,
      },
      shouldIncludeReaction: {
        userId: actor?.id,
      },
    });

    const isPost = postEntity && postEntity instanceof PostEntity;
    if (!isPost || postEntity.isInArchivedGroups()) {
      throw new ContentNotFoundException();
    }

    if (postEntity.isHidden() && !postEntity.isOwner(actor.id)) {
      throw new ContentAccessDeniedException();
    }

    if (postEntity.isDraft()) {
      throw new ContentNoPublishYetException();
    }

    const groups = await this._groupAdapter.getGroupsByIds(
      payload.groupIds || postEntity.get('groupIds')
    );

    await this._setPostAttributes(postEntity, groups, payload, actor);
    await this._validatePost(postEntity, groups, payload, actor);

    if (postEntity.hasVideoProcessing() && !postEntity.isWaitingSchedule()) {
      postEntity.setProcessing();
    }

    if (postEntity.isChanged()) {
      await this._contentRepo.update(postEntity);
      this.event.publish(new PostUpdatedEvent({ entity: postEntity, authUser: actor }));
    }

    return postEntity;
  }

  public async updatePostVideoFailProcessed(props: UpdateVideoProcessProps): Promise<void> {
    const { id, videoId, actor } = props;

    const postEntity = await this._contentRepo.findContentByIdInActiveGroup(id, {
      shouldIncludeGroup: true,
      shouldIncludeSeries: true,
    });

    const isPost = postEntity && postEntity instanceof PostEntity;
    if (!isPost || postEntity.isInArchivedGroups()) {
      throw new ContentNotFoundException();
    }

    if (postEntity.isHidden()) {
      throw new ContentAccessDeniedException();
    }

    await this._setNewMedia(postEntity, {
      images: [],
      files: [],
      videos: [
        {
          id: videoId,
        },
      ],
    });

    const isScheduledPost = postEntity.isScheduleFailed() || postEntity.isWaitingSchedule();
    const status = isScheduledPost ? CONTENT_STATUS.SCHEDULE_FAILED : CONTENT_STATUS.DRAFT;

    postEntity.setStatus(status);

    if (postEntity.isChanged()) {
      await this._contentRepo.update(postEntity);
      this.event.publish(new PostVideoFailedEvent({ entity: postEntity, authUser: actor }));
    }
  }

  public async updatePostVideoSuccessProcessed(props: UpdateVideoProcessProps): Promise<void> {
    const { id, videoId, actor } = props;

    const postEntity = await this._contentRepo.findContentByIdInActiveGroup(id, {
      shouldIncludeGroup: true,
      shouldIncludeSeries: true,
    });

    const isPost = postEntity && postEntity instanceof PostEntity;
    if (!isPost || postEntity.isInArchivedGroups()) {
      throw new ContentNotFoundException();
    }

    if (postEntity.isHidden()) {
      throw new ContentAccessDeniedException();
    }

    const isScheduledPost = postEntity.isScheduleFailed() || postEntity.isWaitingSchedule();

    await this._setNewMedia(postEntity, {
      images: [],
      files: [],
      videos: [
        {
          id: videoId,
        },
      ],
    });

    if (postEntity.isChanged()) {
      await this._contentRepo.update(postEntity);
      this.event.publish(new PostVideoSuccessEvent({ entity: postEntity, authUser: actor }));
    }

    if (!isScheduledPost) {
      await this.publish({
        payload: {
          id: postEntity.get('id'),
        },
        actor,
      });
    }
  }

  public async autoSavePost(props: UpdatePostProps): Promise<void> {
    const { payload, actor } = props;

    const postEntity = await this._contentRepo.findContentWithCache({
      where: { id: payload.id },
      include: {
        shouldIncludeGroup: true,
        shouldIncludeSeries: true,
        shouldIncludeLinkPreview: true,
      },
    });

    const isPost = postEntity && postEntity instanceof PostEntity;
    if (!isPost || postEntity.isHidden() || postEntity.isPublished()) {
      return;
    }

    if (!postEntity.isOwner(actor.id)) {
      throw new ContentAccessDeniedException();
    }
    const groups = await this._groupAdapter.getGroupsByIds(
      payload.groupIds || postEntity.get('groupIds')
    );

    await this._setPostAttributes(postEntity, groups, props.payload, actor);
    await this._validatePost(postEntity, groups, props.payload, actor, false);

    if (!postEntity.isChanged()) {
      return;
    }
    return this._contentRepo.update(postEntity);
  }

  public async delete(id: string, authUser: UserDto): Promise<void> {
    const postEntity = await this._contentRepo.findContentWithCache({
      where: { id },
      include: { shouldIncludeGroup: true, shouldIncludeSeries: true },
    });

    const isPost = postEntity && postEntity instanceof PostEntity;
    if (!isPost) {
      throw new ContentNotFoundException();
    }

    if (!postEntity.isOwner(authUser.id)) {
      throw new ContentAccessDeniedException();
    }

    if (postEntity.isPublished()) {
      await this._contentValidator.checkCanCRUDContent({
        user: authUser,
        groupIds: postEntity.get('groupIds'),
        contentType: postEntity.get('type'),
      });
    }

    await this._contentRepo.delete(id);
    this.event.publish(new PostDeletedEvent({ entity: postEntity, authUser: authUser }));
  }

  private async _setPostAttributes(
    postEntity: PostEntity,
    groups: GroupDto[],
    payload: PostPayload,
    actor: UserDto
  ): Promise<void> {
    const { content, seriesIds, tagIds, groupIds, media, mentionUserIds, linkPreview, status } =
      payload;

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

    if (status) {
      postEntity.setStatus(payload.status);
    }

    postEntity.setCommunity(groups.map((group) => group.rootGroupId));

    postEntity.updateAttribute({ content, seriesIds, groupIds, mentionUserIds }, actor.id);
    postEntity.setPrivacyFromGroups(groups);
  }

  private async _validatePost(
    postEntity: PostEntity,
    groups: GroupDto[],
    payload: PostPayload,
    actor: UserDto,
    validatePublishContent = true
  ): Promise<void> {
    const { mentionUserIds } = payload;

    const mentionUsers = await this._userAdapter.getUsersByIds(mentionUserIds || [], {
      withGroupJoined: true,
    });

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
    const linkPreviewEntity = await this._linkPreviewDomain.findOrUpsert(linkPreview);
    postEntity.setLinkPreview(linkPreviewEntity);
  }

  private async _setNewMedia(postEntity: PostEntity, media: MediaRequestDto): Promise<void> {
    const ownerId = postEntity.get('createdBy');

    const imageEntities = postEntity.get('media').images;
    const fileEntities = postEntity.get('media').files;

    const newImageIds = media?.images?.map((image) => image.id) || [];
    const newFileIds = media?.files?.map((file) => file.id) || [];
    const newVideoIds = media?.videos?.map((video) => video.id) || [];

    const images = await this._mediaDomain.getAvailableImages(imageEntities, newImageIds, ownerId);
    if (images.some((image) => !image.isPostContentResource())) {
      throw new InvalidResourceImageException();
    }
    const files = await this._mediaDomain.getAvailableFiles(fileEntities, newFileIds, ownerId);
    const videos = await this._mediaDomain.getAvailableVideos(newVideoIds, ownerId);

    postEntity.setMedia({
      files,
      images,
      videos,
    });
  }
}
