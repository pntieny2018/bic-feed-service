import { UserDto } from '@libs/service/user';
import { Inject, Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';

import { ArticleDeletedEvent, ArticlePublishedEvent, ArticleUpdatedEvent } from '../event';
import {
  ArticleRequiredCoverException,
  ContentAccessDeniedException,
  ContentEmptyContentException,
  ContentHasBeenPublishedException,
  ContentNoPublishYetException,
  ContentNotFoundException,
  InvalidResourceImageException,
} from '../exception';
import { ArticleEntity } from '../model/content';
import {
  CATEGORY_REPOSITORY_TOKEN,
  CONTENT_REPOSITORY_TOKEN,
  ICategoryRepository,
  IContentRepository,
  ITagRepository,
  TAG_REPOSITORY_TOKEN,
} from '../repositoty-interface';
import {
  ARTICLE_VALIDATOR_TOKEN,
  CATEGORY_VALIDATOR_TOKEN,
  CONTENT_VALIDATOR_TOKEN,
  IArticleValidator,
  ICategoryValidator,
  IContentValidator,
} from '../validator/interface';

import {
  UpdateArticleProps,
  IArticleDomainService,
  PublishArticleProps,
  ArticlePayload,
  ScheduleArticleProps,
  DeleteArticleProps,
  AutoSaveArticleProps,
  IMediaDomainService,
  MEDIA_DOMAIN_SERVICE_TOKEN,
  POST_DOMAIN_SERVICE_TOKEN,
  IPostDomainService,
} from './interface';

@Injectable()
export class ArticleDomainService implements IArticleDomainService {
  public constructor(
    @Inject(POST_DOMAIN_SERVICE_TOKEN)
    private readonly _postDomainService: IPostDomainService,
    @Inject(MEDIA_DOMAIN_SERVICE_TOKEN)
    private readonly _mediaDomainService: IMediaDomainService,

    @Inject(ARTICLE_VALIDATOR_TOKEN)
    private readonly _articleValidator: IArticleValidator,
    @Inject(CATEGORY_VALIDATOR_TOKEN)
    private readonly _categoryValidator: ICategoryValidator,
    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator,

    @Inject(CATEGORY_REPOSITORY_TOKEN)
    protected readonly _categoryRepository: ICategoryRepository,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(TAG_REPOSITORY_TOKEN)
    private readonly _tagRepository: ITagRepository,

    private readonly event: EventBus
  ) {}

  public async getArticleById(articleId: string, authUser: UserDto): Promise<ArticleEntity> {
    const articleEntity = await this._contentRepository.findOne({
      where: {
        id: articleId,
        groupArchived: false,
        excludeReportedByUserId: authUser?.id,
      },
      include: {
        shouldIncludeGroup: true,
        shouldIncludeSeries: true,
        shouldIncludeLinkPreview: true,
        shouldIncludeQuiz: true,
        shouldIncludeCategory: true,
        shouldIncludeSaved: {
          userId: authUser?.id,
        },
        shouldIncludeMarkReadImportant: {
          userId: authUser?.id,
        },
        shouldIncludeReaction: {
          userId: authUser?.id,
        },
      },
    });

    if (
      !articleEntity ||
      !(articleEntity instanceof ArticleEntity) ||
      (articleEntity.isDraft() && !articleEntity.isOwner(authUser.id)) ||
      (articleEntity.isHidden() && !articleEntity.isOwner(authUser.id)) ||
      articleEntity.isInArchivedGroups()
    ) {
      throw new ContentNotFoundException();
    }

    if (!authUser && !articleEntity.isOpen()) {
      throw new ContentAccessDeniedException();
    }

    return articleEntity;
  }

  public async deleteArticle(props: DeleteArticleProps): Promise<void> {
    const { actor, id } = props;

    const articleEntity = await this._contentRepository.findOne({
      where: {
        id,
        groupArchived: false,
      },
      include: {
        shouldIncludeGroup: true,
        shouldIncludeSeries: true,
      },
    });

    if (!articleEntity || !(articleEntity instanceof ArticleEntity)) {
      throw new ContentNotFoundException();
    }
    if (!articleEntity.isOwner(actor.id)) {
      throw new ContentAccessDeniedException();
    }

    if (articleEntity.isPublished()) {
      await this._contentValidator.checkCanCRUDContent(
        actor,
        articleEntity.get('groupIds'),
        articleEntity.get('type')
      );
    }

    await this._contentRepository.delete(id);
    this.event.publish(new ArticleDeletedEvent(articleEntity, actor));
  }

  public async publish(input: PublishArticleProps): Promise<ArticleEntity> {
    const { payload, actor } = input;
    const { id: articleId } = payload;

    const articleEntity = await this._contentRepository.findContentByIdInActiveGroup(articleId, {
      shouldIncludeGroup: true,
      shouldIncludeCategory: true,
      shouldIncludeSeries: true,
    });

    const isArticle = articleEntity && articleEntity instanceof ArticleEntity;
    if (!isArticle || articleEntity.isHidden()) {
      throw new ContentNotFoundException();
    }

    if (articleEntity.isPublished()) {
      return articleEntity;
    }

    await this._setArticleEntityAttributes(articleEntity, payload, actor);
    articleEntity.setPublish();

    await this._articleValidator.validateArticle(articleEntity, actor);
    await this._articleValidator.validateLimitedToAttachSeries(articleEntity);
    this._articleValidator.validateArticleToPublish(articleEntity);

    await this._contentRepository.update(articleEntity);
    this.event.publish(new ArticlePublishedEvent(articleEntity, actor));

    await this._postDomainService.markSeen(articleEntity.get('id'), actor.id);
    articleEntity.increaseTotalSeen();

    if (articleEntity.isImportant()) {
      await this._postDomainService.markReadImportant(articleEntity.get('id'), actor.id);
      articleEntity.setMarkReadImportant();
    }

    return articleEntity;
  }

  public async schedule(inputData: ScheduleArticleProps): Promise<ArticleEntity> {
    const { payload, actor } = inputData;
    const { id, scheduledAt } = payload;

    const articleEntity = await this._contentRepository.findContentByIdInActiveGroup(id, {
      shouldIncludeGroup: true,
      shouldIncludeCategory: true,
      shouldIncludeSeries: true,
    });

    const isArticle = articleEntity && articleEntity instanceof ArticleEntity;
    if (!isArticle || articleEntity.isHidden()) {
      throw new ContentNotFoundException();
    }

    if (articleEntity.isPublished()) {
      throw new ContentHasBeenPublishedException();
    }

    await this._setArticleEntityAttributes(articleEntity, payload, actor);

    articleEntity.setWaitingSchedule(scheduledAt);

    await this._articleValidator.validateArticle(articleEntity, actor);
    await this._articleValidator.validateLimitedToAttachSeries(articleEntity);
    this._articleValidator.validateArticleToPublish(articleEntity);

    if (articleEntity.isChanged()) {
      await this._contentRepository.update(articleEntity);
    }

    return articleEntity;
  }

  public async update(inputData: UpdateArticleProps): Promise<ArticleEntity> {
    const { actor, id, coverMedia } = inputData;

    const articleEntity = await this._contentRepository.findOne({
      where: {
        id,
        groupArchived: false,
      },
      include: {
        shouldIncludeGroup: true,
        shouldIncludeCategory: true,
        shouldIncludeSeries: true,
        shouldIncludeQuiz: true,
      },
    });

    if (
      !articleEntity ||
      !(articleEntity instanceof ArticleEntity) ||
      (articleEntity.isHidden() && !articleEntity.isOwner(actor.id)) ||
      articleEntity.isInArchivedGroups()
    ) {
      throw new ContentNotFoundException();
    }

    if (articleEntity.isDraft()) {
      throw new ContentNoPublishYetException();
    }

    if (coverMedia && !coverMedia.id) {
      throw new ArticleRequiredCoverException();
    }

    await this._setArticleEntityAttributes(
      articleEntity,
      {
        id: inputData.id,
        title: inputData.title,
        summary: inputData.summary,
        content: inputData.content,
        categoryIds: inputData.categories,
        seriesIds: inputData.series,
        tagIds: inputData.tags,
        groupIds: inputData.groupIds,
        coverMedia: inputData.coverMedia,
        wordCount: inputData.wordCount,
      },
      actor
    );

    await this._articleValidator.validateArticle(articleEntity, actor);

    await this._articleValidator.validateLimitedToAttachSeries(articleEntity);

    if (!articleEntity.isValidArticleToPublish()) {
      throw new ContentEmptyContentException();
    }

    if (!articleEntity.isChanged()) {
      return;
    }

    await this._contentRepository.update(articleEntity);
    this.event.publish(new ArticleUpdatedEvent(articleEntity, actor));

    return articleEntity;
  }

  public async autoSave(inputData: AutoSaveArticleProps): Promise<void> {
    const { actor, id, coverMedia } = inputData;

    const articleEntity = await this._contentRepository.findOne({
      where: {
        id,
        groupArchived: false,
      },
      include: {
        shouldIncludeGroup: true,
        shouldIncludeCategory: true,
        shouldIncludeSeries: true,
      },
    });

    if (!articleEntity || !(articleEntity instanceof ArticleEntity)) {
      throw new ContentNotFoundException();
    }

    if (articleEntity.isPublished()) {
      return;
    }

    if (!articleEntity.isOwner(actor.id)) {
      throw new ContentAccessDeniedException();
    }

    if (coverMedia && !coverMedia.id) {
      throw new ArticleRequiredCoverException();
    }

    await this._setArticleEntityAttributes(
      articleEntity,
      {
        id: inputData.id,
        title: inputData.title,
        summary: inputData.summary,
        content: inputData.content,
        categoryIds: inputData.categories,
        seriesIds: inputData.series,
        tagIds: inputData.tags,
        groupIds: inputData.groupIds,
        coverMedia: inputData.coverMedia,
        wordCount: inputData.wordCount,
      },
      inputData.actor
    );

    await this._articleValidator.validateArticle(articleEntity, inputData.actor);

    if (!articleEntity.isChanged()) {
      return;
    }

    return this._contentRepository.update(articleEntity);
  }

  private async _setArticleEntityAttributes(
    articleEntity: ArticleEntity,
    payload: ArticlePayload,
    actor: UserDto
  ): Promise<void> {
    const { categoryIds, tagIds, coverMedia, ...restUpdate } = payload;

    if (tagIds) {
      const newTags = await this._tagRepository.findAll({ ids: tagIds });
      articleEntity.setTags(newTags);
    }

    if (coverMedia) {
      const images = await this._mediaDomainService.getAvailableImages(
        [articleEntity.get('cover')],
        [coverMedia.id],
        articleEntity.get('createdBy')
      );
      if (images[0] && !images[0].isArticleCoverResource()) {
        throw new InvalidResourceImageException();
      }
      articleEntity.setCover(images[0]);
    }

    if (categoryIds) {
      const newCategories = await this._categoryRepository.findAll({ where: { ids: categoryIds } });
      if (newCategories.length) {
        await this._categoryValidator.checkValidCategories(categoryIds, actor.id);
      }
      articleEntity.setCategories(newCategories);
    }

    articleEntity.updateAttribute({ ...restUpdate, seriesIds: restUpdate.seriesIds }, actor.id);
  }
}
