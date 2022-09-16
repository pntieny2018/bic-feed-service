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
import { FindAttributeOptions, Includeable } from 'sequelize';
import { ArrayHelper, ExceptionHelper } from '../../common/helpers';
import { ReactionService } from '../reaction';
import { SentryService } from '../../../libs/sentry/src';
import { CreateArticleDto } from './dto/requests/create-article.dto';
import { ArticleResponseDto } from './dto/responses/article.response.dto';
import { UpdateArticleDto } from './dto/requests/update-article.dto';
import { GetArticleDto } from './dto/requests/get-article.dto';
import { ClassTransformer } from 'class-transformer';
import { PostService } from '../post/post.service';
import { PageDto } from '../../common/dto';
import { EntityType } from '../media/media.constants';
import { CategoryService } from '../category/category.service';
import { SeriesService } from '../series/series.service';
import { HashtagService } from '../hashtag/hashtag.service';
import { GroupService } from '../../shared/group';
import { MediaModel } from '../../database/models/media.model';
import { LogicException } from '../../common/exceptions';
import { GetListArticlesDto } from './dto/requests';
import { PostGroupModel } from '../../database/models/post-group.model';
import { MentionModel } from '../../database/models/mention.model';
import { NIL } from 'uuid';
import { CategoryModel } from '../../database/models/category.model';
import { SeriesModel } from '../../database/models/series.model';
import { PostBindingService } from '../post/post-binding.service';
import { ClientKafka } from '@nestjs/microservices';
import { PostEditedHistoryModel } from '../../database/models/post-edited-history.model';
import { FeedService } from '../feed/feed.service';
import { UserMarkReadPostModel } from '../../database/models/user-mark-read-post.model';
import { UserService } from '../../shared/user';
import { GetRelatedArticlesDto } from './dto/requests/get-related-articles.dto';

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
    @InjectModel(PostEditedHistoryModel)
    protected readonly postEditedHistoryModel: typeof PostEditedHistoryModel,
    @Inject(KAFKA_PRODUCER)
    protected readonly client: ClientKafka,
    protected readonly sentryService: SentryService,
    protected readonly postBinding: PostBindingService,
    private readonly _hashtagService: HashtagService,
    private readonly _seriesService: SeriesService,
    private readonly _categoryService: CategoryService
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
      postEditedHistoryModel,
      client,
      sentryService,
      postBinding
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
    const result = await this.postBinding.bindRelatedData(articles, {
      shouldBindReation: true,
      shouldBindActor: true,
      shouldBindMention: true,
      shouldBindAudience: true,
      shouldHideSecretAudienceCanNotAccess: true,
      authUser,
    });

    return new PageDto<ArticleResponseDto>(result as ArticleResponseDto[], {
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
    const result = await this.postBinding.bindRelatedData(rowsJson, {
      shouldBindActor: true,
    });

    return new PageDto<ArticleResponseDto>(result as ArticleResponseDto[], {
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
   * @param postId string
   * @param user UserDto
   * @param getArticleDto GetArticleDto
   * @returns Promise resolve ArticleResponseDto
   * @throws HttpException
   */
  public async get(
    postId: string,
    authUser: UserDto,
    getArticleDto?: GetArticleDto
  ): Promise<ArticleResponseDto> {
    const attributes = this.getAttributesObj({ loadMarkRead: true, authUserId: authUser.id });
    const include = this.getIncludeObj({
      shouldIncludeOwnerReaction: true,
      shouldIncludeGroup: true,
      shouldIncludeMention: true,
      shouldIncludeMedia: true,
      shouldIncludeCategory: true,
      shouldIncludeSeries: true,
      authUserId: authUser.id,
    });
    const article = await this.postModel.findOne({
      attributes,
      where: { id: postId },
      include,
    });
    if (!article) {
      throw new LogicException(HTTP_STATUS_ID.APP_POST_NOT_EXISTING);
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
          postId,
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
    const rows = await this.postBinding.bindRelatedData([jsonArticle], {
      shouldBindReation: true,
      shouldBindActor: true,
      shouldBindMention: true,
      shouldBindAudience: true,
      shouldHideSecretAudienceCanNotAccess: true,
      authUser,
    });
    rows[0]['comments'] = comments;
    return rows[0] as ArticleResponseDto;
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
    shouldIncludeMention,
    shouldIncludeMedia,
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
    authUserId?: string;
  }): Includeable[] {
    const includes: Includeable[] = super.getIncludeObj({
      shouldIncludeOwnerReaction,
      shouldIncludeGroup,
      shouldIncludeMention,
      shouldIncludeMedia,
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
    const article = await this.postModel.findOne({
      where: {
        id: articleId,
      },
      include: [
        {
          model: CategoryModel,
          through: {
            attributes: [],
          },
          attributes: ['id', 'name'],
          required: false,
        },
      ],
    });
    if (article.categories.length === 0) {
      throw new BadRequestException('Category is required');
    }
    return this.publish(articleId, authUser);
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

      const oldGroupIds = post.audience.groups.map((group) => group.id);
      if (audience.groupIds && !ArrayHelper.arraysEqual(audience.groupIds, oldGroupIds)) {
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

  public async getArticlesByMedia(id: string): Promise<ArticleResponseDto[]> {
    const posts = await this.postModel.findAll({
      include: [
        {
          model: MediaModel,
          through: {
            attributes: [],
          },
          attributes: ['id', 'url', 'type', 'name', 'width', 'height', 'thumbnails', 'createdAt'],
          required: true,
          where: {
            id,
          },
        },
        {
          model: CategoryModel,
          through: {
            attributes: [],
          },
          attributes: ['id', 'name'],
          required: false,
        },
        {
          model: SeriesModel,
          through: {
            attributes: [],
          },
          attributes: ['id', 'name'],
          required: false,
        },
        {
          model: PostGroupModel,
          as: 'groups',
          attributes: ['groupId'],
        },
        {
          model: MentionModel,
          as: 'mentions',
        },
      ],
    });

    const jsonPosts = posts.map((p) => p.toJSON());
    await Promise.all([
      this.postBinding.bindAudienceToPost(jsonPosts),
      this.mentionService.bindMentionsToPosts(jsonPosts),
      this.postBinding.bindActorToPost(jsonPosts),
    ]);
    const result = this._classTransformer.plainToInstance(ArticleResponseDto, jsonPosts, {
      excludeExtraneousValues: true,
    });
    return result;
  }

  public async maskArticleContent(articles: any[]): Promise<void> {
    for (const article of articles) {
      if (article.isLocked) article.content = null;
    }
  }
}
