import { SentryService } from '@app/sentry';
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { ClassTransformer } from 'class-transformer';
import { FindAttributeOptions, FindOptions, Includeable, Op, WhereOptions } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { NIL } from 'uuid';
import { HTTP_STATUS_ID, MentionableType } from '../../common/constants';
import { OrderEnum, PageDto } from '../../common/dto';
import { LogicException } from '../../common/exceptions';
import { ArrayHelper, ExceptionHelper } from '../../common/helpers';
import { MediaStatus } from '../../database/models/media.model';
import { PostCategoryModel } from '../../database/models/post-category.model';
import { PostGroupModel } from '../../database/models/post-group.model';
import { PostHashtagModel } from '../../database/models/post-hashtag.model';
import { PostSeriesModel } from '../../database/models/post-series.model';
import { PostTagModel } from '../../database/models/post-tag.model';
import { IPost, PostModel, PostStatus, PostType } from '../../database/models/post.model';
import { ReportContentDetailModel } from '../../database/models/report-content-detail.model';
import { UserMarkReadPostModel } from '../../database/models/user-mark-read-post.model';
import { UserSavePostModel } from '../../database/models/user-save-post.model';
import { GroupService } from '../../shared/group';
import { UserService } from '../../shared/user';
import { UserDto } from '../auth';
import { CategoryService } from '../category/category.service';
import { CommentService } from '../comment';
import { FeedService } from '../feed/feed.service';
import { HashtagService } from '../hashtag/hashtag.service';
import { LinkPreviewService } from '../link-preview/link-preview.service';
import { MediaService } from '../media';
import { EntityType } from '../media/media.constants';
import { MentionService } from '../mention';
import { PostHelper } from '../post/post.helper';
import { PostService } from '../post/post.service';
import { ReactionService } from '../reaction';
import { TargetType } from '../report-content/contstants';
import { SeriesService } from '../series/series.service';
import { TagService } from '../tag/tag.service';
import { ArticleBindingService } from './article-binding.service';
import {
  CreateArticleDto,
  GetArticleDto,
  GetListArticlesDto,
  UpdateArticleDto,
} from './dto/requests';
import { GetDraftArticleDto } from './dto/requests/get-draft-article.dto';
import { GetRelatedArticlesDto } from './dto/requests/get-related-articles.dto';
import { ScheduleArticleDto } from './dto/requests/schedule-article.dto';
import { ArticleInSeriesResponseDto, ArticleResponseDto } from './dto/responses';

@Injectable()
export class ArticleService extends PostService {
  /**
   * Logger
   * @private
   */
  private _logger = new Logger(ArticleService.name);

  /**
   *  ClassTransformer
   * @private
   */
  private _classTransformer = new ClassTransformer();

  public constructor(
    @InjectConnection()
    protected sequelizeConnection: Sequelize,
    @InjectModel(PostModel)
    protected postModel: typeof PostModel,
    @InjectModel(PostGroupModel)
    protected postGroupModel: typeof PostGroupModel,
    @InjectModel(PostSeriesModel)
    protected postSeriesModel: typeof PostSeriesModel,
    @InjectModel(PostCategoryModel)
    protected postCategoryModel: typeof PostCategoryModel,
    @InjectModel(PostHashtagModel)
    protected postHashtagModel: typeof PostHashtagModel,
    @InjectModel(PostTagModel)
    protected postTagModel: typeof PostTagModel,
    @InjectModel(UserMarkReadPostModel)
    protected userMarkReadPostModel: typeof UserMarkReadPostModel,
    protected userService: UserService,
    protected groupService: GroupService,
    protected mediaService: MediaService,
    protected mentionService: MentionService,
    @Inject(forwardRef(() => CommentService))
    protected commentService: CommentService,
    protected reactionService: ReactionService,
    @Inject(forwardRef(() => FeedService))
    protected feedService: FeedService,
    @InjectModel(UserSavePostModel)
    protected userSavePostModel: typeof UserSavePostModel,
    protected readonly sentryService: SentryService,
    protected readonly articleBinding: ArticleBindingService,
    private readonly _hashtagService: HashtagService,
    @Inject(forwardRef(() => SeriesService))
    private readonly _seriesService: SeriesService,
    private readonly _categoryService: CategoryService,
    private readonly _linkPreviewService: LinkPreviewService,
    @InjectModel(ReportContentDetailModel)
    protected readonly reportContentDetailModel: typeof ReportContentDetailModel,
    protected readonly tagService: TagService
  ) {
    super(
      sequelizeConnection,
      postModel,
      postGroupModel,
      postSeriesModel,
      postCategoryModel,
      postHashtagModel,
      postTagModel,
      userMarkReadPostModel,
      userSavePostModel,
      userService,
      groupService,
      mediaService,
      mentionService,
      commentService,
      reactionService,
      feedService,
      sentryService,
      articleBinding,
      _linkPreviewService,
      reportContentDetailModel,
      tagService
    );
  }

  /**
   * Get article list
   */
  public async getList(
    authUser: UserDto,
    getArticleListDto: GetListArticlesDto
  ): Promise<PageDto<ArticleResponseDto>> {
    const { limit, offset } = getArticleListDto;

    const articleIdsAndSorted = await this._getArticleIdsWithFilter(getArticleListDto, authUser);
    if (articleIdsAndSorted.length === 0) {
      return new PageDto<ArticleResponseDto>([], {
        hasNextPage: false,
        limit,
        offset,
      });
    }
    const hasNextPage = articleIdsAndSorted.length === limit + 1;
    articleIdsAndSorted.pop();

    const jsonarticles = await this._getArticlesByIds(articleIdsAndSorted, authUser);
    const articles = this.classTransformer.plainToInstance(ArticleResponseDto, jsonarticles, {
      excludeExtraneousValues: true,
    });
    return new PageDto<ArticleResponseDto>(articles, {
      hasNextPage,
      limit,
      offset,
    });
  }

  private async _getArticlesByIds(ids: string[], authUser): Promise<IPost[]> {
    const include = this.getIncludeObj({
      shouldIncludeCategory: true,
      shouldIncludeGroup: true,
      shouldIncludeMedia: true,
      shouldIncludeMention: true,
      shouldIncludeOwnerReaction: true,
      shouldIncludeCover: true,
      mustIncludeGroup: true,
      authUserId: authUser.id,
    });

    const attributes = {
      include: [PostModel.loadSaved(authUser.id)],
      exclude: ['content'],
    };
    if (authUser) {
      attributes.include.push(PostModel.loadMarkReadPost(authUser.id));
      attributes.include.push(PostModel.loadSaved(authUser.id));
    }
    const rows = await this.postModel.findAll({
      attributes,
      include,
      where: {
        id: ids,
        isHidden: false,
        status: PostStatus.PUBLISHED,
      },
    });

    const mappedPosts = [];
    for (const id of ids) {
      const post = rows.find((row) => row.id === id);
      if (post) mappedPosts.push(post.toJSON());
    }

    return mappedPosts;
  }

  public async getArticlesInSeries(
    seriesId: string,
    authUser: UserDto
  ): Promise<ArticleInSeriesResponseDto[]> {
    const articlesInSeries = await this.postSeriesModel.findAll({
      where: {
        seriesId,
      },
      order: [
        ['zindex', 'ASC'],
        ['createdAt', 'ASC'],
      ],
    });

    const articleIdsReported = await this.getEntityIdsReportedByUser(authUser.id, [
      TargetType.ARTICLE,
    ]);
    const articleIdsSorted = articlesInSeries
      .filter((article) => !articleIdsReported.includes(article.postId))
      .map((article) => article.postId);
    const articles = await this._getArticlesByIds(articleIdsSorted, authUser);
    const articlesBindedData = await this.articleBinding.bindRelatedData(articles, {
      shouldBindActor: true,
      shouldBindMention: true,
      shouldBindAudience: true,
      shouldHideSecretAudienceCanNotAccess: false,
    });

    return this.classTransformer.plainToInstance(ArticleInSeriesResponseDto, articlesBindedData, {
      excludeExtraneousValues: true,
    });
  }

  private async _getArticleIdsWithFilter(
    getListArticleDto: GetListArticlesDto,
    authUser: UserDto
  ): Promise<string[]> {
    const { groupId, categories, hashtags, series, offset, limit, tags } = getListArticleDto;
    const include = [];
    if (groupId) {
      const groupIds = await this._getGroupIdAndChildIdsUserCanAccess(groupId, authUser);
      if (groupIds.length === 0) return [];
      include.push({
        model: PostGroupModel,
        as: 'groups',
        required: true,
        attributes: [],
        where: {
          groupId: groupIds,
        },
      });
    }

    if (categories && categories.length > 0) {
      include.push({
        model: PostCategoryModel,
        required: true,
        attributes: [],
        where: {
          categoryId: categories,
        },
      });
    }

    if (series && series.length > 0) {
      include.push({
        model: PostSeriesModel,
        required: true,
        attributes: [],
        where: {
          seriesId: series,
        },
      });
    }

    if (hashtags && hashtags.length > 0) {
      include.push({
        model: PostHashtagModel,
        required: true,
        attributes: [],
        where: {
          hashtagId: hashtags,
        },
      });
    }

    if (tags && tags.length > 0) {
      include.push({
        model: PostTagModel,
        required: true,
        attributes: [],
        where: {
          tagId: tags,
        },
      });
    }

    const conditions = {
      status: PostStatus.PUBLISHED,
    };

    const articles = await this.postModel.findAll({
      attributes: ['id'],
      include,
      subQuery: false,
      where: conditions,
      order: [['createdAt', 'desc']],
      offset,
      limit,
    });

    return articles.map((article) => article.id);
  }
  /**
   * Get Draft Articles
   */
  public async getDrafts(
    authUserId: string,
    getDraftPostDto: GetDraftArticleDto
  ): Promise<PageDto<ArticleResponseDto>> {
    const { limit, offset, order, isProcessing } = getDraftPostDto;
    const condition = {
      createdBy: authUserId,
      status: PostStatus.DRAFT,
      type: PostType.ARTICLE,
    };

    if (isProcessing) condition['status'] = PostStatus.PROCESSING;

    const result = await this.getsAndCount(condition, order, { limit, offset });

    return new PageDto<ArticleResponseDto>(result.data, {
      total: result.count,
      limit,
      offset,
    });
  }

  public async getsAndCount(
    condition: WhereOptions<IPost>,
    order?: OrderEnum,
    otherParams?: FindOptions
  ): Promise<{ data: ArticleResponseDto[]; count: number }> {
    const attributes = this.getAttributesObj({ loadMarkRead: false });
    const include = this.getIncludeObj({
      shouldIncludeOwnerReaction: false,
      shouldIncludeGroup: true,
      shouldIncludeMention: true,
      shouldIncludeMedia: true,
      shouldIncludeCategory: true,
      shouldIncludeCover: true,
    });
    const orderOption = [];
    if (
      condition['status'] &&
      PostHelper.scheduleTypeStatus.some((e) => condition['status'].includes(e))
    ) {
      orderOption.push(['publishedAt', order]);
    } else {
      orderOption.push(['createdAt', order]);
    }
    const rows = await this.postModel.findAll<PostModel>({
      where: condition,
      attributes,
      include,
      subQuery: false,
      order: orderOption,
      ...otherParams,
    });
    const jsonArticles = rows.map((r) => r.toJSON());
    const articlesBindedData = await this.articleBinding.bindRelatedData(jsonArticles, {
      shouldBindActor: true,
      shouldBindMention: true,
      shouldBindAudience: true,
      shouldHideSecretAudienceCanNotAccess: false,
    });

    await this.articleBinding.bindCommunity(articlesBindedData);

    const result = this.classTransformer.plainToInstance(ArticleResponseDto, articlesBindedData, {
      excludeExtraneousValues: true,
    });
    const total = await this.postModel.count<PostModel>({
      where: condition,
      attributes,
      include: otherParams.include ? otherParams.include : include,
      distinct: true,
    });

    return {
      data: result,
      count: total,
    };
  }

  /**
   * Get list related article
   * @throws HttpException
   * @param authUser UserDto
   * @param getArticleListDto GetListArticlesDto
   * @returns Promise resolve PageDto<ArticleResponseDto>
   */
  public async getRelatedById(
    getRelatedArticlesDto: GetRelatedArticlesDto,
    user: UserDto
  ): Promise<PageDto<ArticleResponseDto>> {
    const { limit, offset, id } = getRelatedArticlesDto;

    const groupIdsUserCanAccess: string[] = user.profile.groups;
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
      shouldIncludeCover: true,
      shouldIncludeCategory: true,
      mustIncludeGroup: true,
      filterGroupIds: groupIdsUserCanAccess,
      filterCategoryIds: categoryIds,
    });
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
      },
      offset,
      limit,
    });

    const rowsJson = relatedRows.map((row) => row.toJSON());
    const articlesBindedData = await this.articleBinding.bindRelatedData(rowsJson, {
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

  private async _getGroupIdAndChildIdsUserCanAccess(groupId, authUser: UserDto): Promise<string[]> {
    const group = await this.groupService.get(groupId);
    if (!group) {
      throw new BadRequestException(`Group ${groupId} not found`);
    }
    const groupIds = this.groupService.getGroupIdAndChildIdsUserJoined(group, authUser);

    return groupIds;
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
      shouldIncludeMention: true,
      shouldIncludeMedia: true,
      shouldIncludeCategory: true,
      shouldIncludePreviewLink: true,
      shouldIncludeCover: true,
      shouldIncludeSeries: true,
      authUserId: authUser?.id || null,
    });

    let condition;
    if (authUser) {
      condition = {
        id: articleId,
        type: PostType.ARTICLE,
        [Op.or]: [{ status: PostStatus.PUBLISHED }, { createdBy: authUser.id }],
      };
    } else {
      condition = { id: articleId, type: PostType.ARTICLE, isHidden: false };
    }
    return this.getDetail(
      attributes,
      condition,
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
      throw new LogicException(HTTP_STATUS_ID.APP_ARTICLE_NOT_EXISTING);
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
    const articlesBindedData = await this.articleBinding.bindRelatedData([jsonArticle], {
      shouldBindReaction: true,
      shouldBindActor: true,
      shouldBindMention: true,
      shouldBindAudience: true,
      shouldHideSecretAudienceCanNotAccess: shouldHideSecretAudienceCanNotAccess ?? true,
      authUser,
    });
    await this.articleBinding.bindCommunity(articlesBindedData);
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
    const attributes: FindAttributeOptions = super.getAttributesObj(options);

    if (attributes['include'] && Array.isArray(attributes['include'])) {
      attributes['include'].push(['hashtags_json', 'hashtags']);
    } else {
      attributes['include'] = [['hashtags_json', 'hashtags']];
    }
    return attributes;
  }

  public getIncludeObj({
    mustIncludeGroup,
    mustIncludeMedia,
    mustInSeriesIds,
    shouldIncludeOwnerReaction,
    shouldIncludeGroup,
    shouldIncludeMention,
    shouldIncludeMedia,
    shouldIncludePreviewLink,
    shouldIncludeArticlesInSeries,
    shouldIncludeCategory,
    shouldIncludeCover,
    shouldIncludeSeries,
    filterMediaIds,
    filterCategoryIds,
    filterGroupIds,
    authUserId,
  }: {
    mustIncludeGroup?: boolean;
    mustIncludeMedia?: boolean;
    mustInSeriesIds?: string[];
    shouldIncludeOwnerReaction?: boolean;
    shouldIncludeGroup?: boolean;
    shouldIncludeMention?: boolean;
    shouldIncludeMedia?: boolean;
    shouldIncludeCategory?: boolean;
    shouldIncludePreviewLink?: boolean;
    shouldIncludeCover?: boolean;
    shouldIncludeSeries?: boolean;
    shouldIncludeArticlesInSeries?: boolean;
    filterCategoryIds?: string[];
    filterMediaIds?: string[];
    filterGroupIds?: string[];
    authUserId?: string;
  }): Includeable[] {
    const includes: Includeable[] = super.getIncludeObj({
      mustIncludeGroup,
      mustIncludeMedia,
      mustInSeriesIds,
      shouldIncludeOwnerReaction,
      shouldIncludeGroup,
      shouldIncludeMention,
      shouldIncludeMedia,
      shouldIncludePreviewLink,
      shouldIncludeCategory,
      shouldIncludeCover,
      shouldIncludeArticlesInSeries,
      shouldIncludeSeries,
      filterMediaIds,
      filterCategoryIds,
      filterGroupIds,
      authUserId,
    });
    return includes;
  }

  /**
   * Create Post
   * @param authUser UserDto
   * @param createPostDto CreatePostDto
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async create(authUser: UserDto, createArticleDto: CreateArticleDto): Promise<any> {
    let transaction;
    try {
      const {
        title,
        summary,
        content,
        media,
        setting,
        mentions,
        audience,
        categories,
        tags,
        hashtags,
        series,
      } = createArticleDto;
      const authUserId = authUser.id;

      let groupIds = [];
      if (audience.groupIds) {
        groupIds = audience.groupIds;
      }

      const { files, images, videos } = media;
      const uniqueMediaIds = [...new Set([...files, ...images, ...videos].map((i) => i.id))];

      const linkPreview = await this.linkPreviewService.upsert(createArticleDto.linkPreview);

      transaction = await this.sequelizeConnection.transaction();
      let hashtagArr = [];
      if (hashtags) {
        hashtagArr = await this._hashtagService.findOrCreateHashtags(hashtags);
      }
      let tagList = [];
      if (tags) {
        tagList = await this.tagService.getTagsByIds(tags);
      }
      const post = await this.postModel.create(
        {
          title,
          summary,
          status: PostStatus.DRAFT,
          type: PostType.ARTICLE,
          content: content,
          createdBy: authUserId,
          updatedBy: authUserId,
          isImportant: setting.isImportant,
          importantExpiredAt: setting.isImportant === false ? null : setting.importantExpiredAt,
          canShare: setting.canShare,
          canComment: setting.canComment,
          canReact: setting.canReact,
          privacy: null,
          hashtagsJson: hashtagArr,
          tagsJson: tagList,
          views: 0,
          linkPreviewId: linkPreview?.id || null,
        },
        { transaction }
      );
      if (uniqueMediaIds.length) {
        await this.mediaService.createIfNotExist(media, authUserId);
        await this.mediaService.sync(post.id, EntityType.POST, uniqueMediaIds, transaction);
      }

      await Promise.all([
        this._seriesService.addToPost(series, post.id, transaction),
        this._hashtagService.addToPost(
          hashtagArr.map((h) => h.id),
          post.id,
          transaction
        ),
        this.tagService.addToPost(tags, post.id, transaction),
        this._categoryService.addToPost(categories, post.id, transaction),
        this.addGroup(groupIds, post.id, transaction),
      ]);

      if (mentions.length) {
        await this.mentionService.create(
          mentions.map((userId) => ({
            entityId: post.id,
            userId,
            mentionableType: MentionableType.POST,
          })),
          transaction
        );
      }

      await transaction.commit();

      return post;
    } catch (error) {
      if (typeof transaction !== 'undefined') await transaction.rollback();
      this._logger.error(JSON.stringify(error?.stack));
      this.sentryService.captureException(error);
      throw error;
    }
  }

  /**
   * Publish article
   * @param authUser UserDto
   * @param createArticleDto CreateArticleDto
   * @returns Promise resolve boolean
   * @throws HttpException
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
            m.status === MediaStatus.WAITING_PROCESS ||
            m.status === MediaStatus.PROCESSING ||
            m.status === MediaStatus.FAILED
        ).length > 0
      ) {
        status = PostStatus.PROCESSING;
      }
      const postPrivacy = await this.getPrivacy(groupIds);
      await this.postModel.update(
        {
          status,
          privacy: postPrivacy,
          createdAt: new Date(),
        },
        {
          where: {
            id: article.id,
            createdBy: authUserId,
          },
        }
      );
      article.status = status;
      if (article.setting.isImportant) {
        const checkMarkImportant = this.userMarkReadPostModel.findOne({
          where: {
            postId: article.id,
            userId: authUserId,
          },
        });
        if (!checkMarkImportant) {
          await this.userMarkReadPostModel.create({
            postId: article.id,
            userId: authUserId,
          });
        }
        article.markedReadPost = true;
      }
      return article;
    } catch (error) {
      this.logger.error(error, error?.stack);
      throw error;
    }
  }

  /**
   * Update view article
   * @param postId postID
   * @param authUser UserDto
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async updateView(postId: string, authUser: UserDto): Promise<boolean> {
    const authUserId = authUser.id;
    const creator = authUser.profile;
    if (!creator) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_USER_NOT_EXISTING);
    }
    try {
      const dataUpdate = { views: 1 };
      await this.postModel.increment(dataUpdate, {
        where: {
          id: postId,
          createdBy: authUserId,
        },
      });
      return true;
    } catch (error) {
      this._logger.error(JSON.stringify(error?.stack));
      throw error;
    }
  }

  /**
   * Update Post except status === DRAFT
   * @param postId postID
   * @param authUser UserDto
   * @param UpdateArticleDto UpdateArticleDto
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async update(
    post: ArticleResponseDto,
    authUser: UserDto,
    updateArticleDto: UpdateArticleDto
  ): Promise<boolean> {
    const authUserId = authUser.id;

    let transaction;
    try {
      const { media, mentions, audience, categories, series, hashtags, tags } = updateArticleDto;
      let mediaListChanged = [];
      if (media) {
        mediaListChanged = await this.mediaService.createIfNotExist(media, authUserId);
      }

      const dataUpdate = await this.getDataUpdate(updateArticleDto, authUserId);

      if (
        mediaListChanged &&
        mediaListChanged.filter(
          (m) =>
            m.status === MediaStatus.WAITING_PROCESS ||
            m.status === MediaStatus.PROCESSING ||
            m.status === MediaStatus.FAILED
        ).length > 0
      ) {
        dataUpdate['status'] = PostStatus.PROCESSING;
      }

      dataUpdate.linkPreviewId = null;
      if (updateArticleDto.linkPreview) {
        const linkPreview = await this.linkPreviewService.upsert(updateArticleDto.linkPreview);
        dataUpdate.linkPreviewId = linkPreview?.id || null;
      }

      transaction = await this.sequelizeConnection.transaction();

      if (media) {
        const { files, images, videos } = media;
        const newMediaIds = [...new Set([...files, ...images, ...videos].map((i) => i.id))];
        await this.mediaService.sync(post.id, EntityType.POST, newMediaIds, transaction);
      }

      if (mentions) {
        await this.mentionService.setMention(mentions, MentionableType.POST, post.id, transaction);
      }

      const oldGroupIds = post.audience?.groups.map((group) => group.id) ?? [];

      if (audience.groupIds && !ArrayHelper.arraysEqual(audience.groupIds, oldGroupIds)) {
        await this.setGroupByPost(audience.groupIds, post.id, transaction);
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
      if (hashtags) {
        const hashtagArr = await this._hashtagService.findOrCreateHashtags(hashtags);
        await this._hashtagService.updateToPost(
          hashtagArr.map((i) => i.id),
          post.id,
          transaction
        );
        dataUpdate['hashtagsJson'] = hashtagArr;
      }
      if (tags) {
        const tagList = await this.tagService.getTagsByIds(tags);
        await this.tagService.updateToPost(tags, post.id, transaction);
        dataUpdate['tagsJson'] = tagList;
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
      if (typeof transaction !== 'undefined') await transaction.rollback();
      this._logger.error(JSON.stringify(error?.stack));
      throw error;
    }
  }

  protected async getDataUpdate(
    updateArticleDto: UpdateArticleDto,
    authUserId: string
  ): Promise<Partial<IPost>> {
    const dataUpdate = await super.getDataUpdate(updateArticleDto, authUserId);
    const { title, summary, coverMedia } = updateArticleDto;
    if (title !== null) {
      dataUpdate['title'] = title;
    }
    if (summary !== null) {
      dataUpdate['summary'] = summary;
    }

    dataUpdate['cover'] = coverMedia?.id || null;

    return dataUpdate;
  }

  public async getsByMedia(id: string): Promise<ArticleResponseDto[]> {
    const include = this.getIncludeObj({
      mustIncludeMedia: true,
      shouldIncludeGroup: true,
      shouldIncludeMention: true,
      filterMediaIds: [id],
    });
    const articles = await this.postModel.findAll({ include });

    const jsonArticles = articles.map((p) => p.toJSON());

    const result = await this.articleBinding.bindRelatedData(jsonArticles, {
      shouldBindAudience: true,
      shouldBindMention: true,
      shouldBindActor: true,
    });

    return this.classTransformer.plainToInstance(ArticleResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  public async maskArticleContent(articles: any[]): Promise<void> {
    for (const article of articles) {
      if (article.isLocked) article.content = null;
    }
  }

  public async schedule(articleId: string, scheduleArticleDto: ScheduleArticleDto): Promise<void> {
    await this.postModel.update(
      { status: PostStatus.WAITING_SCHEDULE, publishedAt: scheduleArticleDto.publishedAt },
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
