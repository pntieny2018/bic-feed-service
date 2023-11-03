import { MEDIA_PROCESS_STATUS } from '@beincom/constants';
import { SentryService } from '@libs/infra/sentry';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { ClassTransformer } from 'class-transformer';
import { FindAttributeOptions, Includeable, Op, WhereOptions } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { NIL } from 'uuid';

import { PageDto } from '../../common/dto';
import { ArrayHelper } from '../../common/helpers';
import { PostCategoryModel } from '../../database/models/post-category.model';
import { PostSeriesModel } from '../../database/models/post-series.model';
import { PostTagModel } from '../../database/models/post-tag.model';
import { IPost, PostModel, PostStatus, PostType } from '../../database/models/post.model';
import { UserMarkReadPostModel } from '../../database/models/user-mark-read-post.model';
import { CategoryService } from '../category/category.service';
import { CommentService } from '../comment';
import { LinkPreviewService } from '../link-preview/link-preview.service';
import { MentionService } from '../mention';
import { PostBindingService } from '../post/post-binding.service';
import { PostHelper } from '../post/post.helper';
import { PostService } from '../post/post.service';
import { TargetType } from '../report-content/contstants';
import { SeriesService } from '../series/series.service';
import { TagService } from '../tag/tag.service';
import { GROUP_APPLICATION_TOKEN, IGroupApplicationService } from '../v2-group/application';
import { ContentNotFoundException } from '../v2-post/domain/exception';
import { UserDto } from '../v2-user/application';

import { GetArticleDto, UpdateArticleDto } from './dto/requests';
import { GetRelatedArticlesDto } from './dto/requests/get-related-articles.dto';
import { ScheduleArticleDto } from './dto/requests/schedule-article.dto';
import { ArticleResponseDto } from './dto/responses';

@Injectable()
export class ArticleService {
  /**
   * Logger
   * @private
   */
  private logger = new Logger(ArticleService.name);

  /**
   *  ClassTransformer
   * @private
   */
  private classTransformer = new ClassTransformer();

  public constructor(
    @InjectConnection()
    protected sequelizeConnection: Sequelize,
    @InjectModel(PostModel)
    protected postModel: typeof PostModel,
    @InjectModel(PostSeriesModel)
    protected postSeriesModel: typeof PostSeriesModel,
    @InjectModel(PostCategoryModel)
    protected postCategoryModel: typeof PostCategoryModel,
    @InjectModel(PostTagModel)
    protected postTagModel: typeof PostTagModel,
    @InjectModel(UserMarkReadPostModel)
    protected userMarkReadPostModel: typeof UserMarkReadPostModel,
    @Inject(GROUP_APPLICATION_TOKEN)
    protected groupAppService: IGroupApplicationService,
    protected mentionService: MentionService,
    protected commentService: CommentService,
    protected readonly sentryService: SentryService,
    protected readonly postBindingService: PostBindingService,
    private readonly _seriesService: SeriesService,
    private readonly _linkPreviewService: LinkPreviewService,
    protected readonly tagService: TagService,
    private readonly _categoryService: CategoryService,
    private readonly _postService: PostService
  ) {}

  /**
   * Get list related article
   * @throws HttpException
   * @param authUser MediaDto
   * @param getArticleListDto GetListArticlesDto
   * @returns Promise resolve PageDto<ArticleResponseDto>
   */
  public async getRelatedById(
    getRelatedArticlesDto: GetRelatedArticlesDto,
    user: UserDto
  ): Promise<PageDto<ArticleResponseDto>> {
    const { limit, offset, id } = getRelatedArticlesDto;

    const groupIdsUserCanAccess: string[] = user.groups;
    const includePostDetail = this.getIncludeObj({
      shouldIncludeCategory: true,
    });

    const article = await this.postModel.findOne({
      include: includePostDetail,
      where: {
        id,
      },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }
    const categoryIds = article.categories.map((category) => category.id);

    const includeRelated = this.getIncludeObj({
      shouldIncludeCategory: true,
      mustIncludeGroup: true,
      filterGroupIds: groupIdsUserCanAccess,
      filterCategoryIds: categoryIds,
    });

    const articleIdsReported = await this._postService.getEntityIdsReportedByUser(user.id, [
      TargetType.ARTICLE,
    ]);

    const relatedRows = await this.postModel.findAll({
      attributes: [
        'id',
        'title',
        'summary',
        'type',
        'cover',
        'createdBy',
        'linkPreviewId',
        'createdAt',
      ],
      include: includeRelated,
      where: {
        type: PostType.ARTICLE,
        status: PostStatus.PUBLISHED,
        id: {
          [Op.notIn]: articleIdsReported,
        },
        isHidden: false,
      },
      offset,
      limit,
    });

    const rowsJson = relatedRows.map((row) => row.toJSON());
    const articlesBindedData = await this.postBindingService.bindRelatedData(rowsJson, {
      shouldBindActor: true,
    });

    const result = this.classTransformer.plainToInstance(ArticleResponseDto, articlesBindedData, {
      excludeExtraneousValues: true,
    });

    return new PageDto<ArticleResponseDto>(result, {
      limit,
      offset,
    });
  }

  /**
   * Get Article
   * @param articleId string
   * @param authUser
   * @param getArticleDto GetArticleDto
   * @param shouldHideSecretAudienceCanNotAccess
   * @returns Promise resolve ArticleResponseDto
   * @throws HttpException
   */
  public async get(
    articleId: string,
    authUser: UserDto,
    getArticleDto?: GetArticleDto,
    shouldHideSecretAudienceCanNotAccess?: boolean
  ): Promise<ArticleResponseDto> {
    const attributes = this.getAttributesObj({
      loadSaved: true,
      loadMarkRead: true,
      authUserId: authUser?.id || null,
    });
    const include = this.getIncludeObj({
      shouldIncludeOwnerReaction: true,
      shouldIncludeGroup: true,
      shouldIncludeCategory: true,
      shouldIncludePreviewLink: true,
      shouldIncludeSeries: true,
      authUserId: authUser?.id || null,
    });
    return this.getDetail(
      attributes,
      { id: articleId },
      include,
      articleId,
      authUser,
      getArticleDto,
      shouldHideSecretAudienceCanNotAccess
    );
  }

  public async getDetail(
    attributes: FindAttributeOptions,
    condition: WhereOptions<IPost>,
    include: Includeable[],
    articleId: string,
    authUser: UserDto,
    getArticleDto?: GetArticleDto,
    shouldHideSecretAudienceCanNotAccess?: boolean
  ): Promise<ArticleResponseDto> {
    const article = PostHelper.filterArchivedPost(
      await this.postModel.findOne({
        attributes,
        where: condition,
        include,
      })
    );

    if (!article) {
      throw new ContentNotFoundException();
    }

    let comments = null;
    if (getArticleDto.withComment) {
      comments = await this.commentService.getComments(
        {
          postId: articleId,
          parentId: NIL,
          childLimit: getArticleDto.childCommentLimit,
          order: getArticleDto.commentOrder,
          childOrder: getArticleDto.childCommentOrder,
          limit: getArticleDto.commentLimit,
        },
        authUser,
        false
      );
    }
    const jsonArticle = article.toJSON();
    const articlesBindedData = await this.postBindingService.bindRelatedData([jsonArticle], {
      shouldBindReaction: true,
      shouldBindActor: true,
      shouldBindMention: true,
      shouldBindAudience: true,
      shouldHideSecretAudienceCanNotAccess: shouldHideSecretAudienceCanNotAccess ?? true,
      authUser,
    });
    await this.postBindingService.bindCommunity(articlesBindedData);
    const result = this.classTransformer.plainToInstance(ArticleResponseDto, articlesBindedData, {
      excludeExtraneousValues: true,
    });

    result[0]['comments'] = comments;
    return result[0];
  }

  protected getAttributesObj(options?: {
    loadMarkRead?: boolean;
    loadSaved?: boolean;
    authUserId?: string;
  }): FindAttributeOptions {
    const attributes: FindAttributeOptions = this._postService.getAttributesObj(options);
    return attributes;
  }

  public getIncludeObj({
    mustIncludeGroup,
    mustInSeriesIds,
    shouldIncludeOwnerReaction,
    shouldIncludeGroup,
    shouldIncludePreviewLink,
    shouldIncludeArticlesInSeries,
    shouldIncludeCategory,
    shouldIncludeSeries,
    filterCategoryIds,
    filterGroupIds,
    authUserId,
  }: {
    mustIncludeGroup?: boolean;
    mustInSeriesIds?: string[];
    shouldIncludeOwnerReaction?: boolean;
    shouldIncludeGroup?: boolean;
    shouldIncludeCategory?: boolean;
    shouldIncludePreviewLink?: boolean;
    shouldIncludeSeries?: boolean;
    shouldIncludeArticlesInSeries?: boolean;
    filterCategoryIds?: string[];
    filterGroupIds?: string[];
    authUserId?: string;
  }): Includeable[] {
    const includes: Includeable[] = this._postService.getIncludeObj({
      mustIncludeGroup,
      mustInSeriesIds,
      shouldIncludeOwnerReaction,
      shouldIncludeGroup,
      shouldIncludePreviewLink,
      shouldIncludeCategory,
      shouldIncludeArticlesInSeries,
      shouldIncludeSeries,
      filterCategoryIds,
      filterGroupIds,
      authUserId,
    });
    return includes;
  }

  /**
   * Publish article
   * @param authUser MediaDto
   * @param createArticleDto CreateArticleDto
   * @returns Promise resolve boolean
   * @throws HttpException
   * @note Need to override createdAt when publishing
   */
  public async publish(
    article: ArticleResponseDto,
    authUser: UserDto
  ): Promise<ArticleResponseDto> {
    try {
      const authUserId = authUser.id;
      const groupIds = article.audience.groups.map((g) => g.id);

      let status = PostStatus.PUBLISHED;
      if (
        article.media.videos.filter(
          (m) =>
            m.status === MEDIA_PROCESS_STATUS.WAITING_PROCESS ||
            m.status === MEDIA_PROCESS_STATUS.PROCESSING ||
            m.status === MEDIA_PROCESS_STATUS.FAILED
        ).length > 0
      ) {
        status = PostStatus.PROCESSING;
      }
      const postPrivacy = await this._postService.getPrivacy(groupIds);
      const publishedAt = new Date();
      await this.postModel.update(
        {
          status,
          privacy: postPrivacy,
          publishedAt,
        },
        {
          where: {
            id: article.id,
            createdBy: authUserId,
          },
        }
      );
      article.status = status;
      article.publishedAt = publishedAt;
      if (article.setting.isImportant) {
        const checkMarkImportant = await this.userMarkReadPostModel.findOne({
          where: {
            postId: article.id,
            userId: authUserId,
          },
        });
        if (!checkMarkImportant) {
          await this.userMarkReadPostModel.bulkCreate(
            [
              {
                postId: article.id,
                userId: authUserId,
              },
            ],
            { ignoreDuplicates: true }
          );
        }
        article.markedReadPost = true;
      }
      return article;
    } catch (error) {
      this.logger.error(error, error?.stack);
      throw error;
    }
  }

  public async update(
    post: ArticleResponseDto,
    authUser: UserDto,
    updateArticleDto: UpdateArticleDto
  ): Promise<boolean> {
    const authUserId = authUser.id;

    let transaction;
    try {
      const { coverMedia, audience, categories, series, tags } = updateArticleDto;

      const dataUpdate = await this.getDataUpdate(updateArticleDto, authUserId);

      dataUpdate.linkPreviewId = null;
      if (updateArticleDto.linkPreview) {
        const linkPreview = await this._linkPreviewService.upsert(updateArticleDto.linkPreview);
        dataUpdate.linkPreviewId = linkPreview?.id || null;
      }

      transaction = await this.sequelizeConnection.transaction();

      const oldGroupIds = post.audience?.groups.map((group) => group.id) ?? [];

      if (audience.groupIds && !ArrayHelper.arraysEqual(audience.groupIds, oldGroupIds)) {
        await this._postService.setGroupByPost(audience.groupIds, post.id, transaction);
      }

      if (categories) {
        await this._categoryService.updateToPost(categories, post.id, transaction);
      }
      if (series) {
        const filterSeriesExist = await this.postModel.findAll({
          where: {
            id: series,
          },
        });
        await this._seriesService.updateToPost(
          filterSeriesExist.map((series) => series.id),
          post.id,
          transaction
        );
      }
      if (tags) {
        const tagList = await this.tagService.getTagsByIds(tags);
        await this.tagService.updateToPost(tags, post.id, transaction);
        dataUpdate['tagsJson'] = tagList;
      }

      if (coverMedia) {
        dataUpdate['coverJson'] = coverMedia;
      }

      await this.postModel.update(dataUpdate, {
        where: {
          id: post.id,
          createdBy: authUserId,
        },
        transaction,
      });

      await transaction.commit();
      return true;
    } catch (error) {
      if (typeof transaction !== 'undefined') {
        await transaction.rollback();
      }
      this.logger.error(JSON.stringify(error?.stack));
      throw error;
    }
  }

  protected async getDataUpdate(
    updateArticleDto: UpdateArticleDto,
    authUserId: string
  ): Promise<Partial<IPost>> {
    const { content, audience, title, summary, wordCount } = updateArticleDto;
    const dataUpdate = {
      updatedBy: authUserId,
    };
    if (audience.groupIds.length) {
      const postPrivacy = await this._postService.getPrivacy(audience.groupIds);
      dataUpdate['privacy'] = postPrivacy;
    }

    if (content !== null) {
      dataUpdate['content'] = content;
    }

    if (wordCount !== null) {
      dataUpdate['wordCount'] = wordCount;
    }

    if (title !== null) {
      dataUpdate['title'] = title;
    }
    if (summary !== null) {
      dataUpdate['summary'] = summary;
    }

    return dataUpdate;
  }

  public async schedule(articleId: string, scheduleArticleDto: ScheduleArticleDto): Promise<void> {
    await this.postModel.update(
      { status: PostStatus.WAITING_SCHEDULE, scheduledAt: scheduleArticleDto.publishedAt },
      { where: { id: articleId } }
    );
  }
  public async updateArticleStatusAndLog(
    articleId: string,
    status: PostStatus,
    errorLog: any = null
  ): Promise<void> {
    await this.postModel.update({ status, errorLog }, { where: { id: articleId } });
  }
}
