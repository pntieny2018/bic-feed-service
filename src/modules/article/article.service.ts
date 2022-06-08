import { HTTP_STATUS_ID, MentionableType } from '../../common/constants';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { PostModel } from '../../database/models/post.model';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { UserDto } from '../auth';
import { MediaService } from '../media';
import { MentionService } from '../mention';
import { CommentService } from '../comment';
import { AuthorityService } from '../authority';
import { Sequelize } from 'sequelize-typescript';
import { ArrayHelper, ElasticsearchHelper, ExceptionHelper } from '../../common/helpers';
import { ReactionService } from '../reaction';
import { SentryService } from '../../../libs/sentry/src';
import { CreateArticleDto } from './dto/requests/create-article.dto';
import { ArticleResponseDto } from './dto/responses/article.response.dto';
import { UpdateArticleDto } from './dto/requests/update-article.dto';
import { GetArticleDto } from './dto/requests/get-article.dto';
import { ClassTransformer } from 'class-transformer';
import { PostService } from '../post/post.service';
import { PageDto } from '../../common/dto';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { EntityType } from '../media/media.constants';
import { CategoryService } from '../category/category.service';
import { SeriesService } from '../series/series.service';
import { HashtagService } from '../hashtag/hashtag.service';
import { GroupService } from '../../shared/group';
import { MediaModel, MediaStatus } from '../../database/models/media.model';
import { LogicException } from '../../common/exceptions';
import { GetListArticlesDto, SearchArticlesDto } from './dto/requests';
import { PostGroupModel } from '../../database/models/post-group.model';
import { MentionModel } from '../../database/models/mention.model';
import { PostReactionModel } from '../../database/models/post-reaction.model';
import { NIL } from 'uuid';
import { CategoryModel } from '../../database/models/category.model';
import { SeriesModel } from '../../database/models/series.model';
import { HashtagModel } from '../../database/models/hashtag.model';

@Injectable()
export class ArticleService {
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
    private _sequelizeConnection: Sequelize,
    @InjectModel(PostModel)
    private readonly _postModel: typeof PostModel,
    private readonly _postService: PostService,
    private readonly _groupService: GroupService,
    private readonly _commentService: CommentService,
    private readonly _reactionService: ReactionService,
    private readonly _mentionService: MentionService,
    private readonly _mediaService: MediaService,
    private readonly _categoryService: CategoryService,
    private readonly _seriesService: SeriesService,
    private readonly _hashtagService: HashtagService,
    private readonly _authorityService: AuthorityService,
    private readonly _searchService: ElasticsearchService,
    private readonly _sentryService: SentryService
  ) {}

  /**
   * Search Article
   * @throws HttpException
   * @param authUser UserDto
   * @param searchArticlesDto SearchArticlesDto
   * @returns Promise resolve PageDto<ArticleResponseDto>
   */
  public async searchArticle(
    authUser: UserDto,
    searchArticlesDto: SearchArticlesDto
  ): Promise<PageDto<ArticleResponseDto>> {
    const { limit, offset } = searchArticlesDto;
    const user = authUser.profile;
    if (!user || user.groups.length === 0) {
      return new PageDto<ArticleResponseDto>([], {
        total: 0,
        limit,
        offset,
      });
    }
    const groupIds = user.groups;
    const payload = await this.getPayloadSearch(searchArticlesDto, groupIds);
    const response = await this._searchService.search(payload);
    const hits = response.body.hits.hits;
    const posts = hits.map((item) => {
      const source = item._source;
      source['id'] = item._id;
      return source;
    });

    await Promise.all([
      this._postService.bindActorToPost(posts),
      this._postService.bindAudienceToPost(posts),
      this._postService.bindCommentsCount(posts),
    ]);

    const result = this._classTransformer.plainToInstance(ArticleResponseDto, posts, {
      excludeExtraneousValues: true,
    });

    return new PageDto<ArticleResponseDto>(result, {
      total: response.body.hits.total.value,
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
  public async getList(
    authUser: UserDto,
    getArticleListDto: GetListArticlesDto
  ): Promise<PageDto<ArticleResponseDto>> {
    const { limit, offset } = getArticleListDto;
    const rows = await PostModel.getArticlesData(getArticleListDto, authUser);
    const articles = this.groupArticles(rows);
    const hasNextPage = articles.length === limit + 1 ? true : false;
    if (hasNextPage) articles.pop();

    await Promise.all([
      this._reactionService.bindReactionToPosts(articles),
      this._mentionService.bindMentionsToPosts(articles),
      this._postService.bindActorToPost(articles),
      this._postService.bindAudienceToPost(articles),
    ]);

    const result = this._classTransformer.plainToInstance(ArticleResponseDto, articles, {
      excludeExtraneousValues: true,
    });

    return new PageDto<ArticleResponseDto>(result, {
      hasNextPage,
      limit,
      offset,
    });
  }

  /**
   *
   * @param SearchArticlesDto
   * @param groupIds
   * @returns
   */
  public async getPayloadSearch(
    { categories, series, actors, limit, offset }: SearchArticlesDto,
    groupIds: number[]
  ): Promise<{
    index: string;
    body: any;
    from: number;
    size: number;
  }> {
    // search article
    const body = {
      query: {
        bool: {
          must: [],
          filter: [],
          should: [],
        },
      },
    };

    if (categories && categories.length) {
      body.query.bool.filter.push({
        terms: {
          ['category.id']: categories,
        },
      });
    }

    if (series && series.length) {
      body.query.bool.filter.push({
        terms: {
          ['series.id']: series,
        },
      });
    }

    if (actors && actors.length) {
      body.query.bool.filter.push({
        terms: {
          ['actor.id']: actors,
        },
      });
    }

    if (groupIds.length) {
      body.query.bool.filter.push({
        terms: {
          ['audience.groups.id']: groupIds,
        },
      });
    }
    body['sort'] = [{ createdAt: 'desc' }];
    return {
      index: ElasticsearchHelper.INDEX.POST,
      body,
      from: offset,
      size: limit,
    };
  }

  /**
   * Get Article
   * @param postId string
   * @param user UserDto
   * @param getArticleDto GetArticleDto
   * @returns Promise resolve ArticleResponseDto
   * @throws HttpException
   */
  public async getArticle(
    postId: string,
    user: UserDto,
    getArticleDto?: GetArticleDto
  ): Promise<ArticleResponseDto> {
    const post = await this._postModel.findOne({
      attributes: {
        exclude: ['updatedBy'],
        include: [['hashtags_json', 'hashtags'], PostModel.loadMarkReadPost(user.id)],
      },
      where: { id: postId },
      include: [
        {
          model: SeriesModel,
          as: 'series',
          required: false,
          through: {
            attributes: [],
          },
          attributes: ['id', 'name'],
        },
        {
          model: CategoryModel,
          as: 'categories',
          required: false,
          through: {
            attributes: [],
          },
          attributes: ['id', 'name'],
        },
        {
          model: PostGroupModel,
          as: 'groups',
          required: false,
          attributes: ['groupId'],
        },
        {
          model: MentionModel,
          as: 'mentions',
          required: false,
          attributes: ['userId'],
        },
        {
          model: MediaModel,
          as: 'media',
          required: false,
          attributes: ['id', 'url', 'type', 'name', 'width', 'height', 'status'],
        },
        {
          model: PostReactionModel,
          as: 'ownerReactions',
          required: false,
          where: {
            createdBy: user.id,
          },
        },
      ],
    });
    if (!post) {
      throw new LogicException(HTTP_STATUS_ID.APP_POST_NOT_FOUND);
    }
    await this._authorityService.checkCanReadArticle(user, post);
    let comments = null;
    if (getArticleDto.withComment) {
      comments = await this._commentService.getComments(
        {
          postId,
          parentId: NIL,
          childLimit: getArticleDto.childCommentLimit,
          order: getArticleDto.commentOrder,
          childOrder: getArticleDto.childCommentOrder,
          limit: getArticleDto.commentLimit,
        },
        user,
        false
      );
    }
    const jsonPost = post.toJSON();
    await Promise.all([
      this._reactionService.bindReactionToPosts([jsonPost]),
      this._mentionService.bindMentionsToPosts([jsonPost]),
      this._postService.bindActorToPost([jsonPost]),
      this._postService.bindAudienceToPost([jsonPost]),
    ]);

    const result = this._classTransformer.plainToInstance(ArticleResponseDto, jsonPost, {
      excludeExtraneousValues: true,
    });
    result['comments'] = comments;
    return result;
  }

  /**
   * Get Public Article
   * @param postId string
   * @param getArticleDto GetArticleDto
   * @returns Promise resolve ArticleResponseDto
   * @throws HttpException
   */
  public async getPublicArticle(
    postId: string,
    getArticleDto?: GetArticleDto
  ): Promise<ArticleResponseDto> {
    const post = await this._postModel.findOne({
      attributes: {
        exclude: ['updatedBy'],
        include: [['hashtags_json', 'hashtags']],
      },
      where: { id: postId },
      include: [
        {
          model: SeriesModel,
          as: 'series',
          required: false,
          through: {
            attributes: [],
          },
          attributes: ['id', 'name'],
        },
        {
          model: CategoryModel,
          as: 'categories',
          required: false,
          through: {
            attributes: [],
          },
          attributes: ['id', 'name'],
        },
        {
          model: PostGroupModel,
          as: 'groups',
          required: false,
          attributes: ['groupId'],
        },
        {
          model: MentionModel,
          as: 'mentions',
          required: false,
          attributes: ['userId'],
        },
        {
          model: MediaModel,
          as: 'media',
          required: false,
          attributes: ['id', 'url', 'type', 'name', 'width', 'height', 'status'],
        },
      ],
    });
    if (!post) {
      throw new LogicException(HTTP_STATUS_ID.APP_POST_NOT_FOUND);
    }
    await this._authorityService.checkIsPublicArticle(post);
    let comments = null;
    if (getArticleDto.withComment) {
      comments = await this._commentService.getComments({
        postId,
        parentId: NIL,
        childLimit: getArticleDto.childCommentLimit,
        order: getArticleDto.commentOrder,
        childOrder: getArticleDto.childCommentOrder,
        limit: getArticleDto.commentLimit,
      });
    }
    const jsonPost = post.toJSON();
    await Promise.all([
      this._reactionService.bindReactionToPosts([jsonPost]),
      this._mentionService.bindMentionsToPosts([jsonPost]),
      this._postService.bindActorToPost([jsonPost]),
      this._postService.bindAudienceToPost([jsonPost]),
    ]);

    const result = this._classTransformer.plainToInstance(ArticleResponseDto, jsonPost, {
      excludeExtraneousValues: true,
    });
    result['comments'] = comments;
    return result;
  }

  /**
   * Create Post
   * @param authUser UserDto
   * @param createPostDto CreatePostDto
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async createArticle(authUser: UserDto, createArticleDto: CreateArticleDto): Promise<any> {
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
      const creator = authUser.profile;
      if (!creator) {
        ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_USER_NOT_FOUND);
      }

      const { groupIds } = audience;
      await this._authorityService.checkCanCreatePost(authUser, groupIds);

      if (mentions && mentions.length) {
        await this._mentionService.checkValidMentions(groupIds, mentions);
      }

      const { files, images, videos } = media;
      const uniqueMediaIds = [...new Set([...files, ...images, ...videos].map((i) => i.id))];
      await this._mediaService.checkValidMedia(uniqueMediaIds, authUserId);
      await this._categoryService.checkValidCategory(categories, authUserId);
      await this._seriesService.checkValidSeries(series, authUserId);
      transaction = await this._sequelizeConnection.transaction();
      const postPrivacy = await this._postService.getPrivacyPost(audience.groupIds);
      let hashtagArr = [];
      if (hashtags) {
        hashtagArr = await this._hashtagService.findOrCreateHashtags(hashtags);
      }
      const post = await this._postModel.create(
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
          privacy: postPrivacy,
          hashtagsJson: hashtagArr,
          views: 0,
        },
        { transaction }
      );
      if (uniqueMediaIds.length) {
        await this._mediaService.createIfNotExist(media, authUserId);
        await this._mediaService.sync(post.id, EntityType.POST, uniqueMediaIds, transaction);
      }

      await Promise.all([
        this._seriesService.addPostToSeries(series, post.id, transaction),
        this._hashtagService.addPostToHashtags(
          hashtagArr.map((h) => h.id),
          post.id,
          transaction
        ),
        this._categoryService.addPostToCategories(categories, post.id, transaction),
        this._postService.addPostGroup(groupIds, post.id, transaction),
      ]);

      if (mentions.length) {
        await this._mentionService.create(
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
      this._sentryService.captureException(error);
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
  public async publishArticle(articleId: string, authUser: UserDto): Promise<boolean> {
    return this._postService.publishPost(articleId, authUser);
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
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_USER_NOT_FOUND);
    }
    try {
      const dataUpdate = { views: 1 };
      await this._postModel.increment(dataUpdate, {
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
  public async updateArticle(
    post: ArticleResponseDto,
    authUser: UserDto,
    updateArticleDto: UpdateArticleDto
  ): Promise<boolean> {
    const authUserId = authUser.id;
    const creator = authUser.profile;
    if (!creator) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_USER_NOT_FOUND);
    }

    let transaction;
    try {
      const {
        summary,
        title,
        content,
        media,
        setting,
        mentions,
        audience,
        categories,
        series,
        hashtags,
      } = updateArticleDto;
      const dataUpdate = {
        updatedBy: authUserId,
      };

      if (categories && categories.length === 0) {
        ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_ARTICLE_CATEGORY_REQUIRED);
      }
      if (post.isDraft === false) {
        await this._postService.checkContent(updateArticleDto);
      }
      await this._postService.checkPostOwner(post, authUser.id);
      const oldGroupIds = post.audience.groups.map((group) => group.id);
      if (audience) {
        await this._authorityService.checkCanUpdatePost(authUser, audience.groupIds);
        const postPrivacy = await this._postService.getPrivacyPost(audience.groupIds);
        dataUpdate['privacy'] = postPrivacy;
      }

      if (mentions && mentions.length) {
        await this._mentionService.checkValidMentions(
          audience ? audience.groupIds : oldGroupIds,
          mentions
        );
      }

      if (content !== null) {
        dataUpdate['content'] = content;
      }
      if (title !== null) {
        dataUpdate['title'] = title;
      }
      if (summary !== null) {
        dataUpdate['summary'] = summary;
      }
      if (setting && setting.hasOwnProperty('canShare')) {
        dataUpdate['canShare'] = setting.canShare;
      }
      if (setting && setting.hasOwnProperty('canComment')) {
        dataUpdate['canComment'] = setting.canComment;
      }
      if (setting && setting.hasOwnProperty('canReact')) {
        dataUpdate['canReact'] = setting.canReact;
      }
      if (setting && setting.hasOwnProperty('isImportant')) {
        dataUpdate['isImportant'] = setting.isImportant;
      }
      if (setting && setting.hasOwnProperty('importantExpiredAt')) {
        dataUpdate['importantExpiredAt'] =
          setting.isImportant === false ? null : setting.importantExpiredAt;
      }
      let newMediaIds = [];
      transaction = await this._sequelizeConnection.transaction();
      if (media) {
        const { files, images, videos } = media;
        newMediaIds = [...new Set([...files, ...images, ...videos].map((i) => i.id))];
        await this._mediaService.checkValidMedia(newMediaIds, authUserId);
        const mediaList = await this._mediaService.createIfNotExist(media, authUserId);
        if (
          mediaList.filter(
            (m) => m.status === MediaStatus.WAITING_PROCESS || m.status === MediaStatus.PROCESSING
          ).length > 0
        ) {
          dataUpdate['isDraft'] = true;
          dataUpdate['isProcessing'] = post.isDraft === true ? false : true;
        }
      }

      if (media) {
        await this._mediaService.sync(post.id, EntityType.POST, newMediaIds, transaction);
      }

      if (mentions) {
        await this._mentionService.setMention(mentions, MentionableType.POST, post.id, transaction);
      }
      if (audience && !ArrayHelper.arraysEqual(audience.groupIds, oldGroupIds)) {
        await this._postService.setGroupByPost(audience.groupIds, post.id, transaction);
      }

      if (categories) {
        await this._categoryService.setCategoriesByPost(categories, post.id, transaction);
      }
      if (series) {
        await this._seriesService.setSeriesByPost(series, post.id, transaction);
      }
      if (hashtags) {
        const hashtagArr = await this._hashtagService.findOrCreateHashtags(hashtags);
        await this._hashtagService.setHashtagsByPost(
          hashtagArr.map((i) => i.id),
          post.id,
          transaction
        );
        dataUpdate['hashtagsJson'] = hashtagArr;
      }
      await this._postModel.update(dataUpdate, {
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

  /**
   * Delete post by id
   * @param postId postID
   * @param authUserId auth user ID
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async deleteArticle(id: string, user: UserDto): Promise<any> {
    return this._postService.deletePost(id, user);
  }

  public groupArticles(articles: any[]): any[] {
    return this._postService.groupPosts(articles);
  }
}
