import { Inject, Logger } from '@nestjs/common';

import { DatabaseException } from '../../../../common/exceptions';
import {
  IUserApplicationService,
  USER_APPLICATION_TOKEN,
  UserDto,
} from '../../../v2-user/application';
import {
  ContentAccessDeniedException,
  ContentNoPublishYetException,
  ContentNotFoundException,
  InvalidResourceImageException,
} from '../exception';
import { PostEntity, ArticleEntity, ContentEntity } from '../model/content';
import {
  IContentRepository,
  ITagRepository,
  CONTENT_REPOSITORY_TOKEN,
  TAG_REPOSITORY_TOKEN,
} from '../repositoty-interface';
import { GROUP_ADAPTER, IGroupAdapter } from '../service-adapter-interface';
import {
  CONTENT_VALIDATOR_TOKEN,
  IContentValidator,
  IMentionValidator,
  IPostValidator,
  MENTION_VALIDATOR_TOKEN,
  POST_VALIDATOR_TOKEN,
} from '../validator/interface';

import {
  ArticleCreateProps,
  IPostDomainService,
  PostCreateProps,
  UpdatePostProps,
} from './interface';
import {
  ILinkPreviewDomainService,
  LINK_PREVIEW_DOMAIN_SERVICE_TOKEN,
} from './interface/link-preview.domain-service.interface';
import {
  IMediaDomainService,
  MEDIA_DOMAIN_SERVICE_TOKEN,
} from './interface/media.domain-service.interface';

export class PostDomainService implements IPostDomainService {
  private readonly _logger = new Logger(PostDomainService.name);

  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(POST_VALIDATOR_TOKEN)
    private readonly _postValidator: IPostValidator,
    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator,
    @Inject(MENTION_VALIDATOR_TOKEN)
    private readonly _mentionValidator: IMentionValidator,
    @Inject(LINK_PREVIEW_DOMAIN_SERVICE_TOKEN)
    private readonly _linkPreviewDomainService: ILinkPreviewDomainService,
    @Inject(TAG_REPOSITORY_TOKEN)
    private readonly _tagRepo: ITagRepository,
    @Inject(MEDIA_DOMAIN_SERVICE_TOKEN)
    private readonly _mediaDomainService: IMediaDomainService,
    @Inject(GROUP_ADAPTER)
    private readonly _groupAdapter: IGroupAdapter,
    @Inject(USER_APPLICATION_TOKEN)
    private readonly _userApplicationService: IUserApplicationService
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

  public async createDraftArticle(input: ArticleCreateProps): Promise<ArticleEntity> {
    const { groups, userId } = input;

    const articleEntity = ArticleEntity.create({
      groupIds: groups.map((group) => group.id),
      userId,
    });

    articleEntity.setGroups(groups.map((group) => group.id));
    articleEntity.setPrivacyFromGroups(groups);
    try {
      await this._contentRepository.create(articleEntity);
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
    return articleEntity;
  }

  public async publishPost(props: UpdatePostProps): Promise<PostEntity> {
    const { authUser, id, groupIds, mentionUserIds } = props;
    const postEntity = await this._contentRepository.findOne({
      where: {
        id,
        groupArchived: false,
      },
      include: {
        mustIncludeGroup: true,
        shouldIncludeSeries: true,
        shouldIncludeLinkPreview: true,
      },
    });
    if (!postEntity || !(postEntity instanceof PostEntity) || postEntity.isHidden()) {
      throw new ContentNotFoundException();
    }

    if (postEntity.isPublished()) {
      return postEntity;
    }

    const groups = await this._groupAdapter.getGroupsByIds(groupIds || postEntity.get('groupIds'));
    const mentionUsers = await this._userApplicationService.findAllByIds(mentionUserIds, {
      withGroupJoined: true,
    });

    const newData = {
      ...props,
      mentionUsers,
      groups,
    };

    const { tagIds, media, linkPreview, ...restUpdate } = newData;

    let newTagEntities = [];
    if (tagIds) {
      newTagEntities = await this._tagRepo.findAll({
        ids: tagIds,
      });
      postEntity.setTags(newTagEntities);
    }
    if (media) {
      const images = await this._mediaDomainService.getAvailableImages(
        postEntity.get('media').images,
        media?.imagesIds,
        postEntity.get('createdBy')
      );
      if (images.some((image) => !image.isPostContentResource())) {
        throw new InvalidResourceImageException();
      }
      const files = await this._mediaDomainService.getAvailableFiles(
        postEntity.get('media').files,
        media?.filesIds,
        postEntity.get('createdBy')
      );
      const videos = await this._mediaDomainService.getAvailableVideos(
        postEntity.get('media').videos,
        media?.videosIds,
        postEntity.get('createdBy')
      );
      postEntity.setMedia({
        files,
        images,
        videos,
      });
    }
    if (linkPreview && linkPreview?.url !== postEntity.get('linkPreview')?.get('url')) {
      const linkPreviewEntity = await this._linkPreviewDomainService.findOrUpsert(linkPreview);
      postEntity.setLinkPreview(linkPreviewEntity);
    }
    postEntity.updateAttribute(restUpdate, authUser.id);
    postEntity.setPrivacyFromGroups(newData.groups);
    if (postEntity.hasVideoProcessing()) {
      postEntity.setProcessing();
    } else {
      postEntity.setPublish();
    }

    await this._postValidator.validatePublishContent(
      postEntity,
      authUser,
      postEntity.get('groupIds')
    );
    await this._mentionValidator.validateMentionUsers(newData.mentionUsers, newData.groups);

    await this._postValidator.validateLimitedToAttachSeries(postEntity);

    await this._contentValidator.validateSeriesAndTags(
      newData.groups,
      postEntity.get('seriesIds'),
      postEntity.get('tags')
    );

    if (!postEntity.isChanged()) {
      return;
    }
    await this._contentRepository.update(postEntity);
    return postEntity;
  }

  public async updatePost(props: UpdatePostProps): Promise<PostEntity> {
    const { authUser, id, groupIds, mentionUserIds } = props;

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
      (postEntity.isHidden() && !postEntity.isOwner(authUser.id)) ||
      !(postEntity instanceof PostEntity) ||
      postEntity.isInArchivedGroups()
    ) {
      throw new ContentNotFoundException();
    }

    if (!postEntity.isPublished()) {
      throw new ContentNoPublishYetException();
    }

    const groups = await this._groupAdapter.getGroupsByIds(groupIds || postEntity.get('groupIds'));
    const mentionUsers = await this._userApplicationService.findAllByIds(mentionUserIds, {
      withGroupJoined: true,
    });

    const newData = {
      ...props,
      mentionUsers,
      groups,
    };

    const { tagIds, linkPreview, media, ...restUpdate } = newData;

    let newTagEntities = [];
    if (tagIds) {
      newTagEntities = await this._tagRepo.findAll({
        ids: tagIds,
      });
      postEntity.setTags(newTagEntities);
    }

    if (media) {
      const images = await this._mediaDomainService.getAvailableImages(
        postEntity.get('media').images,
        media?.imagesIds,
        postEntity.get('createdBy')
      );
      if (images.some((image) => !image.isPostContentResource())) {
        throw new InvalidResourceImageException();
      }
      const files = await this._mediaDomainService.getAvailableFiles(
        postEntity.get('media').files,
        media?.filesIds,
        postEntity.get('createdBy')
      );
      const videos = await this._mediaDomainService.getAvailableVideos(
        postEntity.get('media').videos,
        media?.videosIds,
        postEntity.get('createdBy')
      );
      postEntity.setMedia({
        files,
        images,
        videos,
      });
    }
    if (linkPreview && linkPreview?.url !== postEntity.get('linkPreview')?.get('url')) {
      const linkPreviewEntity = await this._linkPreviewDomainService.findOrUpsert(linkPreview);
      postEntity.setLinkPreview(linkPreviewEntity);
    }

    postEntity.updateAttribute(restUpdate, authUser.id);
    postEntity.setPrivacyFromGroups(newData.groups);

    if (postEntity.hasVideoProcessing()) {
      postEntity.setProcessing();
    }

    await this._postValidator.validatePublishContent(
      postEntity,
      authUser,
      postEntity.get('groupIds')
    );
    await this._mentionValidator.validateMentionUsers(newData.mentionUsers, newData.groups);

    await this._postValidator.validateLimitedToAttachSeries(postEntity);

    await this._contentValidator.validateSeriesAndTags(
      newData.groups,
      postEntity.get('seriesIds'),
      postEntity.get('tags')
    );

    if (!postEntity.isChanged()) {
      return;
    }
    await this._contentRepository.update(postEntity);
    return postEntity;
  }

  public async updateSetting(input: {
    contentId: string;
    authUser: UserDto;
    canComment: boolean;
    canReact: boolean;
    isImportant: boolean;
    importantExpiredAt: Date;
  }): Promise<void> {
    const { contentId, authUser, canReact, canComment, isImportant, importantExpiredAt } = input;

    const contentEntity: ContentEntity = await this._contentRepository.findOne({
      where: {
        id: contentId,
        groupArchived: false,
      },
      include: {
        shouldIncludeGroup: true,
      },
    });
    if (!contentEntity || contentEntity.isHidden()) {
      throw new ContentNotFoundException();
    }

    await this._postValidator.checkCanEditContentSetting(authUser, contentEntity.get('groupIds'));
    contentEntity.setSetting({
      canComment,
      canReact,
      isImportant,
      importantExpiredAt,
    });
    await this._contentRepository.update(contentEntity);

    if (isImportant) {
      await this._contentRepository.markReadImportant(contentId, authUser.id);
    }

    contentEntity.commit();
  }

  public async markSeen(contentId: string, userId: string): Promise<void> {
    await this._contentRepository.markSeen(contentId, userId);
  }

  public async markReadImportant(contentId: string, userId: string): Promise<void> {
    const contentEntity = await this._contentRepository.findOne({
      where: {
        id: contentId,
      },
    });
    if (!contentEntity || contentEntity.isHidden()) {
      return;
    }
    if (contentEntity.isDraft()) {
      return;
    }
    if (!contentEntity.isImportant()) {
      return;
    }

    return this._contentRepository.markReadImportant(contentId, userId);
  }

  public async autoSavePost(props: UpdatePostProps): Promise<void> {
    const { id, groupIds, mentionUserIds } = props;
    const postEntity = await this._contentRepository.findOne({
      where: {
        id,
        groupArchived: false,
      },
      include: {
        shouldIncludeGroup: true,
        shouldIncludeSeries: true,
        shouldIncludeLinkPreview: true,
      },
    });
    if (!postEntity || !(postEntity instanceof PostEntity) || postEntity.isHidden()) {
      return;
    }

    if (postEntity.isPublished()) {
      return;
    }

    let groups = undefined;
    if (groupIds || postEntity.get('groupIds')) {
      groups = await this._groupAdapter.getGroupsByIds(groupIds || postEntity.get('groupIds'));
    }
    const mentionUsers = await this._userApplicationService.findAllByIds(mentionUserIds, {
      withGroupJoined: true,
    });

    const newData = {
      ...props,
      mentionUsers,
      groups,
    };
    const { tagIds, linkPreview, media, ...restUpdate } = newData;

    let newTagEntities = [];
    if (tagIds) {
      newTagEntities = await this._tagRepo.findAll({
        ids: tagIds,
      });
      postEntity.setTags(newTagEntities);
    }
    if (media) {
      const images = await this._mediaDomainService.getAvailableImages(
        postEntity.get('media').images,
        media?.imagesIds,
        postEntity.get('createdBy')
      );

      const files = await this._mediaDomainService.getAvailableFiles(
        postEntity.get('media').files,
        media?.filesIds,
        postEntity.get('createdBy')
      );
      const videos = await this._mediaDomainService.getAvailableVideos(
        postEntity.get('media').videos,
        media?.videosIds,
        postEntity.get('createdBy')
      );
      postEntity.setMedia({
        files,
        images,
        videos,
      });
    }
    if (linkPreview?.url !== postEntity.get('linkPreview')?.get('url')) {
      const linkPreviewEntity = await this._linkPreviewDomainService.findOrUpsert(linkPreview);
      postEntity.setLinkPreview(linkPreviewEntity);
    }

    postEntity.updateAttribute(restUpdate, newData.authUser.id);
    postEntity.setPrivacyFromGroups(newData.groups);

    if (!postEntity.isChanged()) {
      return;
    }
    await this._contentRepository.update(postEntity);
    postEntity.commit();
  }

  public async delete(id: string): Promise<void> {
    try {
      await this._contentRepository.delete(id);
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
  }
}
