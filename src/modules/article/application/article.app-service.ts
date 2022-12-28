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
import { UserDto } from '../../auth';
import { AuthorityService } from '../../authority';
import { PostService } from '../../post/post.service';
import { ReportStatus, TargetType } from '../../report-content/contstants';
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
import { FeedService } from 'src/modules/feed/feed.service';
import { IPostGroup } from '../../../database/models/post-group.model';
import { IPost } from '../../../database/models/post.model';

@Injectable()
export class ArticleAppService {
  public constructor(
    private _articleService: ArticleService,
    private _eventEmitter: InternalEventEmitterService,
    private _authorityService: AuthorityService,
    private _postService: PostService,
    private _postSearchService: SearchService,
    private _tagService: TagService,
    private _feedService: FeedService,
    protected readonly authorityService: AuthorityService
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

  public async get(
    user: UserDto,
    articleId: string,
    getArticleDto: GetArticleDto
  ): Promise<ArticleResponseDto> {
    const articleResponseDto = await this._articleService.get(articleId, user, getArticleDto);

    const article = {
      privacy: articleResponseDto.privacy,
      createdBy: articleResponseDto.createdBy,
      isDraft: articleResponseDto.isDraft,
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
      await this.authorityService.checkCanReadArticle(user, article);
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
    const { audience, setting } = createArticleDto;
    if (audience.groupIds) {
      const isEnableSetting =
        setting.isImportant ||
        setting.canComment === false ||
        setting.canReact === false ||
        setting.canShare === false;
      await this._authorityService.checkCanCreatePost(user, audience.groupIds, isEnableSetting);
    }

    const created = await this._articleService.create(user, createArticleDto);
    if (created) {
      const article = await this._articleService.get(created.id, user, new GetArticleDto());
      return article;
    }
  }

  public async updateView(user: UserDto, articleId: string): Promise<boolean> {
    return this._articleService.updateView(articleId, user);
  }

  public async update(
    user: UserDto,
    articleId: string,
    updateArticleDto: UpdateArticleDto
  ): Promise<ArticleResponseDto> {
    const { audience, series, setting, coverMedia, tags } = updateArticleDto;
    const articleBefore = await this._articleService.get(articleId, user, new GetArticleDto());
    if (!articleBefore) ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_POST_NOT_EXISTING);

    await this._authorityService.checkPostOwner(articleBefore, user.id);

    if (articleBefore.isDraft === false) {
      if (audience.groupIds.length === 0) throw new BadRequestException('Audience is required');
      if (coverMedia === null) throw new BadRequestException('Cover is required');
      this._postService.checkContent(updateArticleDto.content, updateArticleDto.media);

      let isEnableSetting = false;
      if (
        setting &&
        (setting.isImportant ||
          setting.canComment === false ||
          setting.canReact === false ||
          setting.canShare === false)
      ) {
        isEnableSetting = true;
      }

      const oldGroupIds = articleBefore.audience.groups.map((group) => group.id);
      await this._authorityService.checkCanUpdatePost(user, oldGroupIds, false);
      this._authorityService.checkUserInSomeGroups(user, oldGroupIds);
      const newAudienceIds = audience.groupIds.filter((groupId) => !oldGroupIds.includes(groupId));
      if (newAudienceIds.length) {
        await this._authorityService.checkCanCreatePost(user, newAudienceIds, isEnableSetting);
      }
      const removeGroupIds = oldGroupIds.filter((id) => !audience.groupIds.includes(id));
      if (removeGroupIds.length) {
        await this._authorityService.checkCanDeletePost(user, removeGroupIds);
      }
      const seriesTagErrorData = {
        seriesIds: [],
        tagIds: [],
        seriesNames: [],
        tagNames: [],
      };

      if (series?.length) {
        const seriesGroups = await this._postService.getListWithGroupsByIds(series, true);
        if (seriesGroups.length < series.length) {
          throw new ForbiddenException({
            code: HTTP_STATUS_ID.API_VALIDATION_ERROR,
            message: `Series parameter is invalid`,
          });
        }
        const invalidSeries = [];
        seriesGroups.forEach((item) => {
          const isValid = item.groups.some((group) => audience.groupIds.includes(group.groupId));
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
      if (tags?.length) {
        const invalidTags = await this._tagService.getInvalidTagsByAudience(
          tags,
          audience.groupIds
        );
        if (invalidTags.length) {
          invalidTags.forEach((e) => {
            seriesTagErrorData.tagIds.push(e.id);
            seriesTagErrorData.tagNames.push(e.name);
          });
        }
      }
      if (seriesTagErrorData.seriesIds.length || seriesTagErrorData.tagIds.length) {
        throw new ForbiddenException({
          code: HTTP_STATUS_ID.API_FORBIDDEN,
          message: 'The following information will be removed when removed audiences:',
          errors: seriesTagErrorData,
        });
      }
    }

    const isUpdated = await this._articleService.update(articleBefore, user, updateArticleDto);
    if (isUpdated) {
      const articleUpdated = await this._articleService.get(articleId, user, new GetArticleDto());
      this._eventEmitter.emit(
        new ArticleHasBeenUpdatedEvent({
          oldArticle: articleBefore,
          newArticle: articleUpdated,
          actor: user.profile,
        })
      );

      return articleUpdated;
    }
  }

  public async publish(user: UserDto, articleId: string): Promise<ArticleResponseDto> {
    const article = await this._articleService.get(articleId, user, new GetArticleDto());
    if (!article) ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_ARTICLE_NOT_EXISTING);
    if (article.isDraft === false) return article;

    await this._authorityService.checkPostOwner(article, user.id);
    const { audience, setting } = article;
    if (audience.groups.length === 0) throw new BadRequestException('Audience is required');
    if (article.coverMedia === null) throw new BadRequestException('Cover is required');
    const groupIds = audience.groups.map((group) => group.id);

    const isEnableSetting =
      setting.isImportant ||
      setting.canComment === false ||
      setting.canReact === false ||
      setting.canShare === false;
    await this._authorityService.checkCanCreatePost(user, groupIds, isEnableSetting);

    const seriesGroups = await this._postService.getListWithGroupsByIds(
      article.series.map((item) => item.id),
      true
    );

    const seriesTagErrorData = {
      seriesIds: [],
      tagIds: [],
      seriesNames: [],
      tagNames: [],
    };

    const invalidSeries = [];
    seriesGroups.forEach((item) => {
      const isValid = item.groups.some((group) => groupIds.includes(group.groupId));
      if (!isValid) {
        invalidSeries.push(item);
      }
    });
    if (invalidSeries.length) {
      if (invalidSeries.length) {
        invalidSeries.forEach((e) => {
          seriesTagErrorData.seriesIds.push(e.id);
          seriesTagErrorData.seriesNames.push(e.title);
        });
      }
    }

    if (article.tags?.length) {
      const invalidTags = await this._tagService.getInvalidTagsByAudience(
        article.tags.map((e) => e.id),
        article.audience.groups.map((e) => e.id)
      );
      if (invalidTags.length) {
        invalidTags.forEach((e) => {
          seriesTagErrorData.tagIds.push(e.id);
          seriesTagErrorData.tagNames.push(e.name);
        });
      }
    }
    if (seriesTagErrorData.seriesIds.length || seriesTagErrorData.tagIds.length) {
      throw new ForbiddenException({
        code: HTTP_STATUS_ID.API_FORBIDDEN,
        message: 'The following information will be removed when removed audiences:',
        errors: seriesTagErrorData,
      });
    }

    this._postService.checkContent(article.content, article.media);

    if (article.categories.length === 0) {
      throw new BadRequestException('Category is required');
    }
    article.isDraft = false;
    const articleUpdated = await this._articleService.publish(article, user);
    this._feedService.markSeenPosts(articleUpdated.id, user.id);
    articleUpdated.totalUsersSeen = Math.max(articleUpdated.totalUsersSeen, 1);
    this._eventEmitter.emit(
      new ArticleHasBeenPublishedEvent({
        article: articleUpdated,
        actor: user.profile,
      })
    );
    return articleUpdated;
  }

  public async delete(user: UserDto, articleId: string): Promise<boolean> {
    const articles = await this._postService.getListWithGroupsByIds([articleId], false);

    if (articles.length === 0) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_POST_NOT_EXISTING);
    }
    const article = articles[0];
    await this._authorityService.checkPostOwner(article, user.id);

    if (article.isDraft === false) {
      await this._authorityService.checkCanDeletePost(
        user,
        article.groups.map((g) => g.groupId)
      );
    }

    const articleDeleted = await this._articleService.delete(article, user);
    if (articleDeleted) {
      this._eventEmitter.emit(
        new ArticleHasBeenDeletedEvent({
          article: articleDeleted,
          actor: user.profile,
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
}
