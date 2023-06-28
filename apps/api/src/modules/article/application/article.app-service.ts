import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InternalEventEmitterService } from '../../../app/custom/event-emitter';
import { HTTP_STATUS_ID } from '../../../common/constants';
import { PageDto } from '../../../common/dto';
import { LogicException } from '../../../common/exceptions';
import { ExceptionHelper } from '../../../common/helpers';
import {
  ArticleHasBeenDeletedEvent,
  ArticleHasBeenPublishedEvent,
  ArticleHasBeenUpdatedEvent,
} from '../../../events/article';
import { AuthorityService } from '../../authority';
import { PostService } from '../../post/post.service';
import { TargetType } from '../../report-content/contstants';
import { SearchService } from '../../search/search.service';
import { ArticleService } from '../article.service';
import { SearchArticlesDto } from '../dto/requests';
import { CreateArticleDto } from '../dto/requests/create-article.dto';
import { GetArticleDto } from '../dto/requests/get-article.dto';
import { GetDraftArticleDto } from '../dto/requests/get-draft-article.dto';
import { GetRelatedArticlesDto } from '../dto/requests/get-related-articles.dto';
import { UpdateArticleDto } from '../dto/requests/update-article.dto';
import { ArticleSearchResponseDto } from '../dto/responses/article-search.response.dto';
import { ArticleResponseDto } from '../dto/responses/article.response.dto';
import { TagService } from '../../tag/tag.service';
import { IPostGroup } from '../../../database/models/post-group.model';
import { IPost, PostStatus } from '../../../database/models/post.model';
import { ScheduleArticleDto } from '../dto/requests/schedule-article.dto';
import { GetPostsByParamsDto } from '../../post/dto/requests/get-posts-by-params.dto';
import { ClassTransformer } from 'class-transformer';
import { PostHelper } from '../../post/post.helper';
import { UserDto } from '../../v2-user/application';
import { PostBindingService } from '../../post/post-binding.service';
import { ExternalService } from '../../../app/external.service';
import { ReactionService } from '../../reaction';
import { RULES } from '../../v2-post/constant';
import { ContentLimitAttachedSeriesException } from '../../v2-post/domain/exception';

@Injectable()
export class ArticleAppService {
  private readonly _classTransformer = new ClassTransformer();
  public constructor(
    private _articleService: ArticleService,
    private _postBindingService: PostBindingService,
    private _eventEmitter: InternalEventEmitterService,
    private _authorityService: AuthorityService,
    private _postService: PostService,
    private _postSearchService: SearchService,
    private _tagService: TagService,
    protected readonly authorityService: AuthorityService,
    private _externalService: ExternalService
  ) {}

  public async getRelatedById(
    user: UserDto,
    getArticleListDto: GetRelatedArticlesDto
  ): Promise<PageDto<ArticleResponseDto>> {
    return this._articleService.getRelatedById(getArticleListDto, user);
  }

  public getDrafts(
    user: UserDto,
    getDraftDto: GetDraftArticleDto
  ): Promise<PageDto<ArticleResponseDto>> {
    return this._articleService.getDrafts(user.id, getDraftDto);
  }

  public async getsByParams(
    authUser: UserDto,
    getPostsByParamsDto: GetPostsByParamsDto
  ): Promise<PageDto<ArticleResponseDto>> {
    const { limit, offset, order, status } = getPostsByParamsDto;
    const condition = {
      createdBy: authUser.id,
    };
    if (status) {
      condition['status'] = status;
    }
    const postsSorted = await this._postService.getPostsByFilter(condition, {
      sortColumn: PostHelper.scheduleTypeStatus.some((e) => condition['status'].includes(e))
        ? 'publishedAt'
        : 'createdAt',
      sortBy: order,
      limit: limit + 1,
      offset,
    });

    let hasNextPage = false;
    if (postsSorted.length > limit) {
      postsSorted.pop();
      hasNextPage = true;
    }

    const postsInfo = await this._postService.getPostsByIds(
      postsSorted.map((post) => post.id),
      authUser.id
    );

    const postsBindedData = await this._postBindingService.bindRelatedData(postsInfo, {
      shouldBindReaction: true,
      shouldBindActor: true,
      shouldBindMention: true,
      shouldBindAudience: true,
      shouldHideSecretAudienceCanNotAccess: true,
      authUser,
    });

    const result = this._classTransformer.plainToInstance(ArticleResponseDto, postsBindedData, {
      excludeExtraneousValues: true,
    });

    return new PageDto<ArticleResponseDto>(result, {
      limit,
      offset,
      hasNextPage,
    });
  }
  public async get(
    user: UserDto,
    articleId: string,
    getArticleDto: GetArticleDto
  ): Promise<ArticleResponseDto> {
    const articleResponseDto = await this._articleService.get(articleId, user, getArticleDto);

    if (
      (articleResponseDto.isHidden || articleResponseDto.status !== PostStatus.PUBLISHED) &&
      articleResponseDto.createdBy !== user?.id
    ) {
      throw new LogicException(HTTP_STATUS_ID.APP_ARTICLE_NOT_EXISTING);
    }
    const article = {
      privacy: articleResponseDto.privacy,
      createdBy: articleResponseDto.createdBy,
      status: articleResponseDto.status,
      type: articleResponseDto.type,
      groups: articleResponseDto.audience.groups.map(
        (g) =>
          ({
            groupId: g.id,
          } as IPostGroup)
      ),
    } as IPost;

    if (
      !articleResponseDto ||
      (articleResponseDto.isHidden === true && articleResponseDto.createdBy !== user?.id)
    ) {
      throw new LogicException(HTTP_STATUS_ID.APP_ARTICLE_NOT_EXISTING);
    }
    if (user) {
      await this.authorityService.checkCanReadArticle(
        user,
        article,
        articleResponseDto.audience.groups
      );
    } else {
      await this.authorityService.checkIsPublicArticle(article);
    }

    if (user) {
      const articleIdsReported = await this._postService.getEntityIdsReportedByUser(user.id, [
        TargetType.ARTICLE,
      ]);
      if (articleIdsReported.includes(articleId) && articleResponseDto.actor.id !== user.id) {
        throw new LogicException(HTTP_STATUS_ID.APP_ARTICLE_NOT_EXISTING);
      }
    }

    return articleResponseDto;
  }

  public async create(
    user: UserDto,
    createArticleDto: CreateArticleDto
  ): Promise<ArticleResponseDto> {
    const { audience } = createArticleDto;
    if (audience.groupIds) {
      await this._authorityService.checkCanCreatePost(user, audience.groupIds);
    }

    const created = await this._articleService.create(user, createArticleDto);
    if (created) {
      const article = await this._articleService.get(created.id, user, new GetArticleDto());
      return article;
    }
  }

  public async update(
    user: UserDto,
    articleId: string,
    updateArticleDto: UpdateArticleDto
  ): Promise<ArticleResponseDto> {
    const { audience, series, coverMedia, tags } = updateArticleDto;
    const articleBefore = await this._articleService.get(articleId, user, new GetArticleDto());
    if (!articleBefore) ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_POST_NOT_EXISTING);

    if (
      updateArticleDto.coverMedia?.id &&
      updateArticleDto.coverMedia.id !== articleBefore.coverMedia?.id
    ) {
      const images = await this._externalService.getImageIds([updateArticleDto.coverMedia.id]);
      if (images.length === 0) {
        throw new BadRequestException('Invalid cover image');
      }
      if (images[0].createdBy !== user.id) {
        throw new BadRequestException('You must be owner this cover');
      }
      if (images[0].status !== 'DONE') {
        throw new BadRequestException('Image is not ready to use');
      }
      if (images[0].resource !== 'article:cover') {
        throw new BadRequestException('Resource type is incorrect');
      }
      updateArticleDto.coverMedia = images[0];
    } else {
      delete updateArticleDto.coverMedia;
    }

    await this._authorityService.checkPostOwner(articleBefore, user.id);

    if (
      articleBefore.status === PostStatus.PUBLISHED ||
      articleBefore.status === PostStatus.WAITING_SCHEDULE
    ) {
      if (audience.groupIds.length === 0) throw new BadRequestException('Audience is required');
      if (coverMedia === null) throw new BadRequestException('Cover is required');
      this._postService.checkContent(updateArticleDto.content, updateArticleDto.media);

      const setting = articleBefore.setting;
      const isEnableSetting =
        setting &&
        (setting.isImportant || setting.canComment === false || setting.canReact === false);

      const oldGroupIds = articleBefore.audience.groups.map((group) => group.id);
      await this._authorityService.checkCanUpdatePost(user, oldGroupIds);
      this._authorityService.checkUserInSomeGroups(user, oldGroupIds);
      const newAudienceIds = audience.groupIds.filter((groupId) => !oldGroupIds.includes(groupId));
      if (newAudienceIds.length) {
        await this._authorityService.checkCanCreatePost(user, newAudienceIds);
        if (isEnableSetting) await this._authorityService.checkCanEditSetting(user, newAudienceIds);
      }
      const removeGroupIds = oldGroupIds.filter((id) => !audience.groupIds.includes(id));
      if (removeGroupIds.length) {
        await this._authorityService.checkCanDeletePost(user, removeGroupIds);
      }

      if (series && series.length > RULES.LIMIT_ATTACHED_SERIES) {
        throw new ContentLimitAttachedSeriesException(RULES.LIMIT_ATTACHED_SERIES);
      }

      await this.isSeriesAndTagsValid(audience.groupIds, series, tags);
    }

    const isUpdated = await this._articleService.update(articleBefore, user, updateArticleDto);
    if (isUpdated) {
      const articleUpdated = await this._articleService.get(articleId, user, new GetArticleDto());
      this._eventEmitter.emit(
        new ArticleHasBeenUpdatedEvent({
          oldArticle: articleBefore,
          newArticle: articleUpdated,
          actor: user,
        })
      );

      return articleUpdated;
    }
  }

  private async _preCheck(article: ArticleResponseDto, user: UserDto): Promise<void> {
    await this._authorityService.checkPostOwner(article, user.id);

    const { audience } = article;
    if (audience.groups.length === 0) throw new BadRequestException('Audience is required');
    if (article.coverMedia === null) throw new BadRequestException('Cover is required');
    const groupIds = audience.groups.map((group) => group.id);

    await this._authorityService.checkCanCreatePost(user, groupIds);

    await this._postService.validateLimtedToAttachSeries([article.id]);

    await this.isSeriesAndTagsValid(
      audience.groups.map((e) => e.id),
      article.series.map((item) => item.id),
      article.tags.map((e) => e.id)
    );

    this._postService.checkContent(article.content, article.media);

    if (article.categories.length === 0) {
      throw new BadRequestException('Category is required');
    }
  }

  public async publish(
    user: UserDto,
    articleId: string,
    isSchedule = false
  ): Promise<ArticleResponseDto> {
    const article = await this._articleService.get(
      articleId,
      isSchedule ? null : user,
      new GetArticleDto(),
      !isSchedule
    );
    if (!article) ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_ARTICLE_NOT_EXISTING);
    if (article.status === PostStatus.PUBLISHED) return article;
    await this._preCheck(article, user);

    article.status = PostStatus.PUBLISHED;
    const articleUpdated = await this._articleService.publish(article, user);
    this._postService.markSeenPost(articleUpdated.id, user.id);
    articleUpdated.totalUsersSeen = Math.max(articleUpdated.totalUsersSeen, 1);
    articleUpdated.reactionsCount = ReactionService.transformReactionFormat(
      articleUpdated.reactionsCount
    );
    this._eventEmitter.emit(
      new ArticleHasBeenPublishedEvent({
        article: articleUpdated,
        actor: user,
      })
    );
    return articleUpdated;
  }

  public async schedule(
    user: UserDto,
    articleId: string,
    scheduleArticleDto: ScheduleArticleDto
  ): Promise<ArticleResponseDto> {
    const article = await this._articleService.get(articleId, user, new GetArticleDto());
    if (!article) ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_ARTICLE_NOT_EXISTING);
    if (article.status === PostStatus.PUBLISHED) return article;
    await this._preCheck(article, user);
    await this._articleService.schedule(articleId, scheduleArticleDto);
    article.status = PostStatus.WAITING_SCHEDULE;
    article.publishedAt = scheduleArticleDto.publishedAt;
    return article;
  }

  public async delete(user: UserDto, articleId: string): Promise<boolean> {
    const articles = await this._postService.getListWithGroupsByIds([articleId], false);

    if (articles.length === 0) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_POST_NOT_EXISTING);
    }
    const article = articles[0];
    await this._authorityService.checkPostOwner(article, user.id);

    if (article.status === PostStatus.PUBLISHED) {
      await this._authorityService.checkCanDeletePost(
        user,
        article.groups.map((g) => g.groupId)
      );
    }

    const articleDeleted = await this._postService.delete(article, user);
    if (articleDeleted) {
      this._eventEmitter.emit(
        new ArticleHasBeenDeletedEvent({
          article: articleDeleted,
          actor: user,
        })
      );
      return true;
    }
    return false;
  }

  public async searchArticles(
    user: UserDto,
    searchDto: SearchArticlesDto
  ): Promise<PageDto<ArticleSearchResponseDto>> {
    return this._postSearchService.searchArticles(user, searchDto);
  }

  public async isSeriesAndTagsValid(
    groupIds: string[],
    seriesIds: string[] = [],
    tagIds: string[] = []
  ): Promise<boolean> {
    const seriesTagErrorData = {
      seriesIds: [],
      tagIds: [],
      seriesNames: [],
      tagNames: [],
    };
    if (seriesIds.length) {
      const seriesGroups = await this._postService.getListWithGroupsByIds(seriesIds, true);
      // if (seriesGroups.length < seriesIds.length) {
      //   throw new ForbiddenException({
      //     code: HTTP_STATUS_ID.API_VALIDATION_ERROR,
      //     message: `Series parameter is invalid`,
      //   });
      // }
      const invalidSeries = [];
      seriesGroups.forEach((item) => {
        const isValid = item.groups.some((group) => groupIds.includes(group.groupId));
        if (!isValid) {
          invalidSeries.push(item);
        }
      });
      if (invalidSeries.length) {
        invalidSeries.forEach((e) => {
          seriesTagErrorData.seriesIds.push(e.id);
          seriesTagErrorData.seriesNames.push(e.title);
        });
      }
    }
    if (tagIds.length) {
      const invalidTags = await this._tagService.getInvalidTagsByAudience(tagIds, groupIds);
      if (invalidTags.length) {
        invalidTags.forEach((e) => {
          seriesTagErrorData.tagIds.push(e.id);
          seriesTagErrorData.tagNames.push(e.name);
        });
      }
    }
    if (seriesTagErrorData.seriesIds.length || seriesTagErrorData.tagIds.length) {
      throw new ForbiddenException({
        code: HTTP_STATUS_ID.APP_ARTICLE_INVALID_PARAMETER,
        message: 'Invalid series, tags',
        errors: seriesTagErrorData,
      });
    }
    return true;
  }
}
