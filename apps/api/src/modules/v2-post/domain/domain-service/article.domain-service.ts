import { GroupDto } from '@libs/service/group';
import { UserDto } from '@libs/service/user';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { uniq } from 'lodash';

import { DatabaseException } from '../../../../common/exceptions';
import {
  ArticleDeletedEvent,
  ArticlePublishedEvent,
  ArticleUpdatedEvent,
  ContentGetDetailEvent,
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
    private readonly _contentDomain: IContentDomainService,
    @Inject(MEDIA_DOMAIN_SERVICE_TOKEN)
    private readonly _mediaDomain: IMediaDomainService,

    @Inject(ARTICLE_VALIDATOR_TOKEN)
    private readonly _articleValidator: IArticleValidator,
    @Inject(CATEGORY_VALIDATOR_TOKEN)
    private readonly _categoryValidator: ICategoryValidator,
    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator,

    @Inject(CATEGORY_REPOSITORY_TOKEN)
    protected readonly _categoryRepo: ICategoryRepository,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepo: IContentRepository,
    @Inject(TAG_REPOSITORY_TOKEN)
    private readonly _tagRepo: ITagRepository,

    @Inject(GROUP_ADAPTER)
    protected readonly _groupAdapter: IGroupAdapter,

    private readonly event: EventBus
  ) {}

  public async getArticleById(articleId: string, authUser: UserDto): Promise<ArticleEntity> {
    const articleEntity = await this._contentRepo.findContentWithCache({
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
      this.event.publish(new ContentGetDetailEvent({ contentId: articleId, userId: authUser.id }));
    }

    return articleEntity;
  }

  public async createDraft(input: CreateArticleProps): Promise<ArticleEntity> {
    const { groups, userId } = input;

    const articleEntity = ArticleEntity.create(userId);

    articleEntity.setGroups(groups.map((group) => group.id));
    articleEntity.setPrivacyFromGroups(groups);
    try {
      await this._contentRepo.create(articleEntity);
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
    return articleEntity;
  }

  public async delete(props: DeleteArticleProps): Promise<void> {
    const { actor, id } = props;

    const articleEntity = await this._contentRepo.findContentByIdInActiveGroup(id, {
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
      await this._contentValidator.checkCanCRUDContent({
        user: actor,
        groupIds: articleEntity.get('groupIds'),
        contentType: articleEntity.get('type'),
      });
    }

    await this._contentRepo.delete(id);
    this.event.publish(new ArticleDeletedEvent({ entity: articleEntity, authUser: actor }));
  }

  public async publish(input: PublishArticleProps): Promise<ArticleEntity> {
    const { payload, actor } = input;
    const { id: articleId } = payload;

    const articleEntity = await this._contentRepo.findContentByIdInActiveGroup(articleId, {
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
    const groupIds = articleEntity.get('groupIds');
    const groups = await this._groupAdapter.getGroupsByIds(groupIds);

    await this._setArticleEntityAttributes(articleEntity, groups, payload, actor);
    articleEntity.setPublish();

    await this._contentValidator.validateSeriesAndTags(
      groups,
      articleEntity.get('seriesIds'),
      articleEntity.get('tags')
    );
    await this._contentValidator.validateLimitedToAttachSeries(articleEntity);
    await this._articleValidator.validateArticleToPublish(articleEntity, actor);

    await this._contentRepo.update(articleEntity);
    this.event.publish(new ArticlePublishedEvent({ entity: articleEntity, authUser: actor }));

    await this._contentDomain.markSeen(articleEntity.get('id'), actor.id);
    articleEntity.increaseTotalSeen();

    if (articleEntity.isImportant()) {
      await this._contentDomain.markReadImportant(articleEntity.get('id'), actor.id);
      articleEntity.setMarkReadImportant();
    }

    return articleEntity;
  }

  public async schedule(inputData: ScheduleArticleProps): Promise<void> {
    const { payload, actor } = inputData;
    const { id, scheduledAt } = payload;

    const articleEntity = await this._contentRepo.findContentByIdInActiveGroup(id, {
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

    const groupIds = articleEntity.get('groupIds');
    const groups = await this._groupAdapter.getGroupsByIds(groupIds);

    await this._setArticleEntityAttributes(articleEntity, groups, payload, actor);

    articleEntity.setWaitingSchedule(scheduledAt);

    await this._contentValidator.validateSeriesAndTags(
      groups,
      articleEntity.get('seriesIds'),
      articleEntity.get('tags')
    );
    await this._contentValidator.validateLimitedToAttachSeries(articleEntity);
    await this._articleValidator.validateArticleToPublish(articleEntity, actor);

    if (articleEntity.isChanged()) {
      await this._contentRepo.update(articleEntity);
    }
  }

  public async update(input: UpdateArticleProps): Promise<ArticleEntity> {
    const { payload, actor } = input;
    const { id: articleId, coverMedia } = payload;

    const articleEntity = await this._contentRepo.findContentByIdInActiveGroup(articleId, {
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

    const groupIds = articleEntity.get('groupIds');
    const groups = await this._groupAdapter.getGroupsByIds(groupIds);

    await this._setArticleEntityAttributes(articleEntity, groups, payload, actor);

    await this._contentValidator.validateSeriesAndTags(
      groups,
      articleEntity.get('seriesIds'),
      articleEntity.get('tags')
    );
    await this._contentValidator.validateLimitedToAttachSeries(articleEntity);
    await this._articleValidator.validateArticleToPublish(articleEntity, actor);

    if (articleEntity.isChanged()) {
      await this._contentRepo.update(articleEntity);
      this.event.publish(new ArticleUpdatedEvent({ entity: articleEntity, authUser: actor }));
    }

    return articleEntity;
  }

  public async autoSave(input: AutoSaveArticleProps): Promise<void> {
    const { payload, actor } = input;
    const { id: articleId, coverMedia } = payload;

    const articleEntity = await this._contentRepo.findContentByIdInActiveGroup(articleId, {
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
    const groupIds = articleEntity.get('groupIds');
    const groups = await this._groupAdapter.getGroupsByIds(groupIds);
    await this._setArticleEntityAttributes(articleEntity, groups, payload, actor);

    if (!articleEntity.isChanged()) {
      return;
    }

    return this._contentRepo.update(articleEntity);
  }

  private async _setArticleEntityAttributes(
    articleEntity: ArticleEntity,
    groups: GroupDto[],
    payload: ArticlePayload,
    actor: UserDto
  ): Promise<void> {
    const { categoryIds, tagIds, coverMedia, ...restUpdate } = payload;

    if (tagIds) {
      const newTags = await this._tagRepo.findAll({ ids: tagIds });
      articleEntity.setTags(newTags);
    }

    if (coverMedia) {
      const images = await this._mediaDomain.getAvailableImages(
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
      const newCategories = await this._categoryRepo.findAll({ where: { ids: categoryIds } });
      if (newCategories.length) {
        await this._categoryValidator.checkValidCategories(categoryIds, actor.id);
      }
      articleEntity.setCategories(newCategories);
    }

    const communityIds = uniq(groups.map((group) => group.rootGroupId));

    articleEntity.setCommunity(communityIds);
    articleEntity.setPrivacyFromGroups(groups);

    articleEntity.updateAttribute({ ...restUpdate, seriesIds: restUpdate.seriesIds }, actor.id);
  }
}
