import { UserDto } from '@libs/service/user';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';

import { DatabaseException } from '../../../../common/exceptions';
import {
  ArticleDeletedEvent,
  ArticlePublishedEvent,
  ArticleUpdatedEvent,
  ContentHasSeenEvent,
} from '../event';
import {
  ArticleRequiredCoverException,
  ContentAccessDeniedException,
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
import { GROUP_ADAPTER, IGroupAdapter } from '../service-adapter-interface';
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
  CreateArticleProps,
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from './interface';

@Injectable()
export class ArticleDomainService implements IArticleDomainService {
  private _logger = new Logger(ArticleDomainService.name);

  public constructor(
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService,
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

    @Inject(GROUP_ADAPTER)
    private readonly _groupAdapter: IGroupAdapter,

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

    const isArticle = articleEntity && articleEntity instanceof ArticleEntity;
    if (!isArticle || articleEntity.isInArchivedGroups()) {
      throw new ContentNotFoundException();
    }

    await this._contentValidator.checkCanReadNotPublishedContent(articleEntity, authUser.id);

    if (!authUser && !articleEntity.isOpen()) {
      throw new ContentAccessDeniedException();
    }

    if (articleEntity.isPublished()) {
      this.event.publish(new ContentHasSeenEvent({ contentId: articleId, userId: authUser.id }));
    }

    return articleEntity;
  }

  public async createDraft(input: CreateArticleProps): Promise<ArticleEntity> {
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

  public async delete(props: DeleteArticleProps): Promise<void> {
    const { actor, id } = props;

    const articleEntity = await this._contentRepository.findContentByIdInActiveGroup(id, {
      shouldIncludeGroup: true,
      shouldIncludeSeries: true,
    });

    const isArticle = articleEntity && articleEntity instanceof ArticleEntity;
    if (!isArticle) {
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
    await this._contentValidator.validateLimitedToAttachSeries(articleEntity);
    this._articleValidator.validateArticleToPublish(articleEntity);

    await this._contentRepository.update(articleEntity);
    this.event.publish(new ArticlePublishedEvent(articleEntity, actor));

    await this._contentDomainService.markSeen(articleEntity.get('id'), actor.id);
    articleEntity.increaseTotalSeen();

    if (articleEntity.isImportant()) {
      await this._contentDomainService.markReadImportant(articleEntity.get('id'), actor.id);
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
    await this._contentValidator.validateLimitedToAttachSeries(articleEntity);
    this._articleValidator.validateArticleToPublish(articleEntity);

    if (articleEntity.isChanged()) {
      await this._contentRepository.update(articleEntity);
    }

    return articleEntity;
  }

  public async update(input: UpdateArticleProps): Promise<ArticleEntity> {
    const { payload, actor } = input;
    const { id: articleId, coverMedia } = payload;

    const articleEntity = await this._contentRepository.findContentByIdInActiveGroup(articleId, {
      shouldIncludeGroup: true,
      shouldIncludeCategory: true,
      shouldIncludeSeries: true,
      shouldIncludeQuiz: true,
    });

    const isArticle = articleEntity && articleEntity instanceof ArticleEntity;
    if (!isArticle || (articleEntity.isHidden() && !articleEntity.isOwner(actor.id))) {
      throw new ContentNotFoundException();
    }

    if (articleEntity.isDraft()) {
      throw new ContentNoPublishYetException();
    }

    if (coverMedia && !coverMedia.id) {
      throw new ArticleRequiredCoverException();
    }

    await this._setArticleEntityAttributes(articleEntity, payload, actor);

    await this._articleValidator.validateArticle(articleEntity, actor);
    await this._contentValidator.validateLimitedToAttachSeries(articleEntity);
    this._articleValidator.validateArticleToPublish(articleEntity);

    if (articleEntity.isChanged()) {
      await this._contentRepository.update(articleEntity);
      this.event.publish(new ArticleUpdatedEvent(articleEntity, actor));
    }

    return articleEntity;
  }

  public async autoSave(input: AutoSaveArticleProps): Promise<void> {
    const { payload, actor } = input;
    const { id: articleId, coverMedia } = payload;

    const articleEntity = await this._contentRepository.findContentByIdInActiveGroup(articleId, {
      shouldIncludeGroup: true,
      shouldIncludeCategory: true,
      shouldIncludeSeries: true,
    });

    const isArticle = articleEntity && articleEntity instanceof ArticleEntity;
    if (!isArticle) {
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

    await this._setArticleEntityAttributes(articleEntity, payload, actor);

    await this._articleValidator.validateArticle(articleEntity, actor);

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
