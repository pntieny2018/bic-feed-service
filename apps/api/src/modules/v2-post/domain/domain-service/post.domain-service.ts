import { Inject, Logger } from '@nestjs/common';

import { DatabaseException } from '../../../../common/exceptions/database.exception';
import { UserDto } from '../../../v2-user/application';
import { ContentNotFoundException } from '../exception';
import { InvalidResourceImageException } from '../exception/media.exception';
import {
  ARTICLE_FACTORY_TOKEN,
  IArticleFactory,
  IPostFactory,
  POST_FACTORY_TOKEN,
} from '../factory/interface';
import { PostEntity } from '../model/content';
import { ArticleEntity } from '../model/content/article.entity';
import { ContentEntity } from '../model/content/content.entity';
import {
  IContentRepository,
  ITagRepository,
  CONTENT_REPOSITORY_TOKEN,
  TAG_REPOSITORY_TOKEN,
} from '../repositoty-interface';
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
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
  IPostDomainService,
  PostCreateProps,
  PostPublishProps,
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
    @Inject(POST_FACTORY_TOKEN)
    private readonly _postFactory: IPostFactory,
    @Inject(ARTICLE_FACTORY_TOKEN)
    private readonly _articleFactory: IArticleFactory,
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
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService
  ) {}

  public async createDraftPost(input: PostCreateProps): Promise<PostEntity> {
    const { groups, userId } = input;
    const postEntity = this._postFactory.createPost({
      groupIds: [],
      userId,
    });
    postEntity.setGroups(groups.map((group) => group.id));
    postEntity.setPrivacyFromGroups(groups);
    try {
      await this._contentRepository.create(postEntity);
      postEntity.commit();
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
    return postEntity;
  }
  public async createDraftArticle(input: ArticleCreateProps): Promise<ArticleEntity> {
    const { groups, userId } = input;
    const articleEntity = this._articleFactory.createArticle({
      groupIds: groups.map((group) => group.id),
      userId,
    });
    articleEntity.setGroups(groups.map((group) => group.id));
    articleEntity.setPrivacyFromGroups(groups);
    try {
      await this._contentRepository.create(articleEntity);
      articleEntity.commit();
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
    return articleEntity;
  }

  public async publishPost(input: PostPublishProps): Promise<void> {
    const { postEntity, newData } = input;
    const { authUser, tagIds, media, linkPreview, ...restUpdate } = newData;

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

    await this._postValidator.validateLimtedToAttachSeries(postEntity);

    await this._contentValidator.validateSeriesAndTags(
      newData.groups,
      postEntity.get('seriesIds'),
      postEntity.get('tags')
    );

    if (!postEntity.isChanged()) {
      return;
    }
    await this._contentRepository.update(postEntity);

    postEntity.commit();
  }

  public async updatePost(input: PostPublishProps): Promise<void> {
    const { postEntity, newData } = input;
    const { authUser, tagIds, linkPreview, media, ...restUpdate } = newData;

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

    await this._postValidator.validateLimtedToAttachSeries(postEntity);

    await this._contentValidator.validateSeriesAndTags(
      newData.groups,
      postEntity.get('seriesIds'),
      postEntity.get('tags')
    );

    if (!postEntity.isChanged()) {
      return;
    }
    await this._contentRepository.update(postEntity);

    postEntity.commit();
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
      await this.markReadImportant(contentId, authUser.id);
    }

    contentEntity.commit();
  }

  public async markSeen(contentId: string, userId: string): Promise<void> {
    await this._contentRepository.markSeen(contentId, userId);
  }

  public async markReadImportant(contentId: string, userId: string): Promise<void> {
    await this._contentDomainService.getImportantContent(contentId);
    return this._contentRepository.markReadImportant(contentId, userId);
  }

  public async autoSavePost(input: PostPublishProps): Promise<void> {
    const { postEntity, newData } = input;
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
