import { HTTP_STATUS_ID, KAFKA_PRODUCER, MentionableType } from '../../common/constants';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { IPost, PostModel } from '../../database/models/post.model';
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { UserDto } from '../auth';
import { MediaService } from '../media';
import { MentionService } from '../mention';
import { CommentService } from '../comment';
import { AuthorityService } from '../authority';
import { Sequelize } from 'sequelize-typescript';
import { FindAttributeOptions, Includeable, Op } from 'sequelize';
import { ArrayHelper, ExceptionHelper } from '../../common/helpers';
import { ReactionService } from '../reaction';
import { SentryService } from '@app/sentry';
import { ArticleResponseDto } from './dto/responses';
import {
  CreateArticleDto,
  UpdateArticleDto,
  GetListArticlesDto,
  GetArticleDto,
} from './dto/requests';
import { ClassTransformer } from 'class-transformer';
import { PostService } from '../post/post.service';
import { PageDto } from '../../common/dto';
import { EntityType } from '../media/media.constants';
import { CategoryService } from '../category/category.service';
import { SeriesService } from '../series/series.service';
import { HashtagService } from '../hashtag/hashtag.service';
import { GroupService } from '../../shared/group';
import { LogicException } from '../../common/exceptions';
import { PostGroupModel } from '../../database/models/post-group.model';
import { NIL } from 'uuid';
import { CategoryModel } from '../../database/models/category.model';
import { SeriesModel } from '../../database/models/series.model';
import { ClientKafka } from '@nestjs/microservices';
import { FeedService } from '../feed/feed.service';
import { UserMarkReadPostModel } from '../../database/models/user-mark-read-post.model';
import { UserService } from '../../shared/user';
import { GetRelatedArticlesDto } from './dto/requests/get-related-articles.dto';
import { LinkPreviewService } from '../link-preview/link-preview.service';
import { ArticleBindingService } from './article-binding.service';

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
    @InjectModel(UserMarkReadPostModel)
    protected userMarkReadPostModel: typeof UserMarkReadPostModel,
    protected userService: UserService,
    protected groupService: GroupService,
    protected mediaService: MediaService,
    protected mentionService: MentionService,
    @Inject(forwardRef(() => CommentService))
    protected commentService: CommentService,
    protected authorityService: AuthorityService,
    protected reactionService: ReactionService,
    @Inject(forwardRef(() => FeedService))
    protected feedService: FeedService,
    @Inject(KAFKA_PRODUCER)
    protected readonly client: ClientKafka,
    protected readonly sentryService: SentryService,
    protected readonly articleBinding: ArticleBindingService,
    private readonly _hashtagService: HashtagService,
    private readonly _seriesService: SeriesService,
    private readonly _categoryService: CategoryService,
    private readonly _linkPreviewService: LinkPreviewService
  ) {
    super(
      sequelizeConnection,
      postModel,
      postGroupModel,
      userMarkReadPostModel,
      userService,
      groupService,
      mediaService,
      mentionService,
      commentService,
      authorityService,
      reactionService,
      feedService,
      client,
      sentryService,
      articleBinding,
      _linkPreviewService
    );
  }

  /**
   * Get list Article
   * @throws HttpException
   * @param authUser UserDto
   * @param getArticleListDto GetListArticlesDto
   * @returns Promise resolve PageDto<ArticleResponseDto>
   */
  public async getList(
    authUser: UserDto,
    getArticleListDto: GetListArticlesDto
  ): Promise<PageDto<ArticleResponseDto>> {
    const { limit, offset, groupId } = getArticleListDto;
    if (groupId) {
      const groupIds = await this._getGroupIdAndChildIdsUserCanAccess(groupId, authUser);
      if (groupIds.length === 0) {
        return new PageDto<ArticleResponseDto>([], {
          limit,
          offset,
          hasNextPage: false,
        });
      }
      getArticleListDto.groupIds = groupIds;
    }

    const rows = await PostModel.getArticlesData(getArticleListDto, authUser);
    const articles = this.group(rows);
    const hasNextPage = articles.length === limit + 1 ? true : false;
    if (hasNextPage) articles.pop();

    await this.maskArticleContent(articles);
    const result = await this.articleBinding.bindRelatedData(articles, {
      shouldBindReaction: true,
      shouldBindActor: true,
      shouldBindMention: true,
      shouldBindAudience: true,
      shouldBindLinkPreview: true,
      shouldHideSecretAudienceCanNotAccess: true,
      authUser,
    });

    return new PageDto<ArticleResponseDto>(result, {
      hasNextPage,
      limit,
      offset,
    });
  }

  /**
   * Get list Article
   * @throws HttpException
   * @param authUser UserDto
   * @param getArticleListDto GetListArticlesDto
   * @returns Promise resolve PageDto<ArticleResponseDto>
   */
  public async getRelatedById(
    getRelatedArticlesDto: GetRelatedArticlesDto
  ): Promise<PageDto<ArticleResponseDto>> {
    const { limit, offset, id } = getRelatedArticlesDto;

    const includePostDetail = this.getIncludeObj({
      shouldIncludeCategory: true,
    });
    const attributes = this.getAttributesObj();
    const article = await this.postModel.findOne({
      attributes,
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
      shouldIncludeMedia: true,
      shouldIncludeCategory: true,
      filterCategoryIds: categoryIds,
    });
    const relatedRows = await this.postModel.findAll({
      attributes,
      include: includeRelated,
      offset,
      limit,
    });

    const rowsJson = relatedRows.map((row) => row.toJSON());
    const result = await this.articleBinding.bindRelatedData(rowsJson, {
      shouldBindActor: true,
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
    const groupIds = this.groupService.getGroupIdsCanAccessArticle(group, authUser);

    return groupIds;
  }
  /**
   * Get Article
   * @param articleId string
   * @param authUser
   * @param getArticleDto GetArticleDto
   * @returns Promise resolve ArticleResponseDto
   * @throws HttpException
   */
  public async get(
    articleId: string,
    authUser: UserDto,
    getArticleDto?: GetArticleDto
  ): Promise<ArticleResponseDto> {
    const attributes = this.getAttributesObj({
      loadMarkRead: true,
      authUserId: authUser?.id || null,
    });
    const include = this.getIncludeObj({
      shouldIncludeOwnerReaction: true,
      shouldIncludeGroup: true,
      shouldIncludeMention: true,
      shouldIncludeMedia: true,
      shouldIncludeCategory: true,
      shouldIncludeSeries: true,
      authUserId: authUser?.id || null,
    });

    let condition;
    if (authUser) {
      condition = {
        id: articleId,
        isArticle: true,
        [Op.or]: [{ isDraft: false }, { isDraft: true, createdBy: authUser.id }],
      };
    } else {
      condition = { id: articleId, isArticle: true };
    }

    const article = await this.postModel.findOne({
      attributes,
      where: condition,
      include,
    });
    if (!article) {
      throw new LogicException(HTTP_STATUS_ID.APP_ARTICLE_NOT_EXISTING);
    }
    if (authUser) {
      await this.authorityService.checkCanReadArticle(authUser, article);
    } else {
      await this.authorityService.checkIsPublicArticle(article);
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
    await this.maskArticleContent([jsonArticle]);
    const rows = await this.articleBinding.bindRelatedData([jsonArticle], {
      shouldBindReaction: true,
      shouldBindActor: true,
      shouldBindMention: true,
      shouldBindAudience: true,
      shouldBindLinkPreview: true,
      shouldHideSecretAudienceCanNotAccess: true,
      authUser,
    });
    rows[0]['comments'] = comments;
    return rows[0];
  }

  protected getAttributesObj(options?: {
    loadMarkRead?: boolean;
    authUserId?: string;
  }): FindAttributeOptions {
    const attributes: FindAttributeOptions = super.getAttributesObj(options);

    if (attributes['includes'] && Array.isArray(attributes['includes'])) {
      attributes['include'].push([['hashtags_json', 'hashtags']]);
    } else {
      attributes['include'] = [['hashtags_json', 'hashtags']];
    }
    return attributes;
  }

  protected getIncludeObj({
    shouldIncludeOwnerReaction,
    shouldIncludeGroup,
    mustIncludeGroup,
    shouldIncludeMention,
    shouldIncludeMedia,
    filterMediaIds,
    mustIncludeMedia,
    shouldIncludeCategory,
    shouldIncludeSeries,
    filterCategoryIds,
    authUserId,
  }: {
    shouldIncludeOwnerReaction?: boolean;
    shouldIncludeGroup?: boolean;
    shouldIncludeMention?: boolean;
    shouldIncludeMedia?: boolean;
    shouldIncludeCategory?: boolean;
    shouldIncludeSeries?: boolean;
    filterCategoryIds?: string[];
    mustIncludeGroup?: boolean;
    mustIncludeMedia?: boolean;
    filterMediaIds?: string[];
    authUserId?: string;
  }): Includeable[] {
    const includes: Includeable[] = super.getIncludeObj({
      shouldIncludeOwnerReaction,
      shouldIncludeGroup,
      shouldIncludeMention,
      shouldIncludeMedia,
      mustIncludeGroup,
      mustIncludeMedia,
      filterMediaIds,
      authUserId,
    });

    if (shouldIncludeCategory) {
      const obj = {
        model: CategoryModel,
        as: 'categories',
        required: false,
        through: {
          attributes: [],
        },
        attributes: ['id', 'name'],
      };
      if (filterCategoryIds) {
        obj['where'] = {
          id: filterCategoryIds,
        };
      }

      includes.push(obj);
    }

    if (shouldIncludeSeries) {
      includes.push({
        model: SeriesModel,
        as: 'series',
        required: false,
        through: {
          attributes: [],
        },
        attributes: ['id', 'name'],
      });
    }
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
      transaction = await this.sequelizeConnection.transaction();
      let hashtagArr = [];
      if (hashtags) {
        hashtagArr = await this._hashtagService.findOrCreateHashtags(hashtags);
      }
      const post = await this.postModel.create(
        {
          title,
          summary,
          isDraft: true,
          isArticle: true,
          content,
          createdBy: authUserId,
          updatedBy: authUserId,
          isImportant: setting.isImportant,
          importantExpiredAt: setting.isImportant === false ? null : setting.importantExpiredAt,
          canShare: setting.canShare,
          canComment: setting.canComment,
          canReact: setting.canReact,
          isProcessing: false,
          privacy: null,
          hashtagsJson: hashtagArr,
          views: 0,
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

      await this.linkPreviewService.upsert(createArticleDto.linkPreview, post.id);

      return post;
    } catch (error) {
      if (typeof transaction !== 'undefined') await transaction.rollback();
      this._logger.error(error, error?.stack);
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
  public async publish(articleId: string, authUser: UserDto): Promise<boolean> {
    const include = this.getIncludeObj({ shouldIncludeCategory: true });
    const article = await this.postModel.findOne({
      where: {
        id: articleId,
      },
      include,
    });
    if (!article) {
      throw new NotFoundException('Article is not found.');
    }
    if (article.categories.length === 0) {
      throw new BadRequestException('Category is required');
    }
    return super.publish(articleId, authUser);
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
      this._logger.error(error, error?.stack);
      throw error;
    }
  }

  /**
   * Update Post except isDraft
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
      const { media, mentions, audience, categories, series, hashtags } = updateArticleDto;
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
        console.log('22222222222');
        await this.setGroupByPost(audience.groupIds, post.id, transaction);
      }

      if (categories) {
        await this._categoryService.updateToPost(categories, post.id, transaction);
      }
      if (series) {
        await this._seriesService.updateToPost(series, post.id, transaction);
      }

      const dataUpdate = await this.getDataUpdate(updateArticleDto, authUserId);

      if (hashtags) {
        const hashtagArr = await this._hashtagService.findOrCreateHashtags(hashtags);
        await this._hashtagService.updateToPost(
          hashtagArr.map((i) => i.id),
          post.id,
          transaction
        );
        dataUpdate['hashtagsJson'] = hashtagArr;
      }

      //if post is draft, isProcessing alway is true
      if (dataUpdate.isProcessing && post.isDraft === true) dataUpdate.isProcessing = false;
      await this.postModel.update(dataUpdate, {
        where: {
          id: post.id,
          createdBy: authUserId,
        },
        transaction,
      });
      await transaction.commit();

      await this.linkPreviewService.upsert(updateArticleDto.linkPreview, post.id);

      return true;
    } catch (error) {
      if (typeof transaction !== 'undefined') await transaction.rollback();
      this._logger.error(error, error?.stack);
      throw error;
    }
  }

  protected async getDataUpdate(
    updateArticleDto: UpdateArticleDto,
    authUserId: string
  ): Promise<Partial<IPost>> {
    const dataUpdate = await super.getDataUpdate(updateArticleDto, authUserId);
    const { title, summary } = updateArticleDto;
    if (title !== null) {
      dataUpdate['title'] = title;
    }
    if (summary !== null) {
      dataUpdate['summary'] = summary;
    }

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

    return result;
  }

  public async maskArticleContent(articles: any[]): Promise<void> {
    for (const article of articles) {
      if (article.isLocked) article.content = null;
    }
  }
}
