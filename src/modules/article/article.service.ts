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
import { PostResponseDto } from '../post/dto/responses';
import { GroupService } from '../../shared/group';
import { MediaStatus } from '../../database/models/media.model';
import { LogicException } from '../../common/exceptions';
import { GetListArticlesDto, SearchArticlesDto } from './dto/requests';

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
   * @param getListArticlesDto GetListArticlesDto
   * @returns Promise resolve PageDto<ArticleResponseDto>
   */
  public async getList(
    authUser: UserDto,
    getListArticlesDto: GetListArticlesDto
  ): Promise<PageDto<ArticleResponseDto>> {
    const { limit, offset, categories, series, hashtags, groupId } = getListArticlesDto;
    const group = await this._groupService.get(groupId);
    if (!group) {
      throw new BadRequestException(`Group ${groupId} not found`);
    }
    const groupIds = this._groupService.getGroupIdsCanAccess(group, authUser);
    if (groupIds.length === 0) {
      return new PageDto<ArticleResponseDto>([], {
        hasNextPage: false,
        limit,
        offset,
      });
    }
    const user = authUser.profile;
    if (!user || user.groups.length === 0) {
      return new PageDto<ArticleResponseDto>([], {
        hasNextPage: false,
        limit,
        offset,
      });
    }

    const authUserId = authUser.id;
    const constraints = PostModel.getArticleConstrains(getListArticlesDto);

    const totalImportantPosts = await PostModel.getTotalImportantPostInGroups(
      authUserId,
      groupIds,
      constraints
    );
    let importantPostsExc = Promise.resolve([]);
    if (offset < totalImportantPosts) {
      importantPostsExc = PostModel.getListArticle({
        categories,
        series,
        hashtags,
        limit: limit + 1,
        groupIds,
        authUser,
        isImportant: true,
        constraints,
      });
    }
    let normalPostsExc = Promise.resolve([]);
    if (offset + limit >= totalImportantPosts) {
      normalPostsExc = PostModel.getListArticle({
        categories,
        series,
        hashtags,
        offset: Math.max(0, offset - totalImportantPosts),
        limit: Math.min(limit + 1, limit + offset - totalImportantPosts + 1),
        groupIds,
        authUser,
        isImportant: false,
        constraints,
      });
    }
    const [importantPosts, normalPosts] = await Promise.all([importantPostsExc, normalPostsExc]);
    const rows = importantPosts.concat(normalPosts);
    const posts = this.groupPosts(rows);
    const hasNextPage = posts.length === limit + 1 ? true : false;
    if (hasNextPage) posts.pop();

    await Promise.all([
      this._reactionService.bindReactionToPosts(posts),
      this._mentionService.bindMentionsToPosts(posts),
      this._postService.bindActorToPost(posts),
      this._postService.bindAudienceToPost(posts),
    ]);

    const result = this._classTransformer.plainToInstance(ArticleResponseDto, posts, {
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
    const post = await this._postService.getPost(postId, user, getArticleDto);
    if (!post.isArticle) {
      throw new LogicException(HTTP_STATUS_ID.APP_POST_NOT_ARTICLE);
    }
    const categories = [];
    const series = [];
    const article = this._classTransformer.plainToInstance(
      ArticleResponseDto,
      { categories, series, ...post },
      {
        excludeExtraneousValues: true,
      }
    );
    return article;
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
    const post = await this._postService.getPublicPost(postId, getArticleDto);
    const categories = [];
    const series = [];
    const article = this._classTransformer.plainToInstance(
      ArticleResponseDto,
      { categories, series, ...post },
      {
        excludeExtraneousValues: true,
      }
    );
    return article;
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
        },
        { transaction }
      );
      if (uniqueMediaIds.length) {
        await this._mediaService.createIfNotExist(media, authUserId);
        await this._mediaService.sync(post.id, EntityType.POST, uniqueMediaIds, transaction);
      }

      let hashtagIds = [];
      if (hashtags) {
        hashtagIds = await this._hashtagService.findOrCreateHashtags(hashtags);
      }
      await Promise.all([
        this._seriesService.addPostToSeries(series, post.id, transaction),
        this._hashtagService.addPostToHashtags(hashtagIds, post.id, transaction),
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
      }

      if (mentions && mentions.length) {
        await this._mentionService.checkValidMentions(
          audience ? audience.groupIds : oldGroupIds,
          mentions
        );
      }

      const dataUpdate = {
        updatedBy: authUserId,
      };

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

      await this._postModel.update(dataUpdate, {
        where: {
          id: post.id,
          createdBy: authUserId,
        },
        transaction,
      });

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
        const hashtagIds = await this._hashtagService.findOrCreateHashtags(hashtags);
        await this._hashtagService.setHashtagsByPost(hashtagIds, post.id, transaction);
      }
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

  public groupPosts(posts: any[]): any[] {
    const result = [];
    posts.forEach((post) => {
      const {
        id,
        commentsCount,
        isImportant,
        importantExpiredAt,
        isDraft,
        content,
        markedReadPost,
        canComment,
        canReact,
        canShare,
        createdBy,
        updatedBy,
        createdAt,
        updatedAt,
        isNowImportant,
      } = post;
      const postAdded = result.find((i) => i.id === post.id);
      if (!postAdded) {
        const groups = post.groupId === null ? [] : [{ groupId: post.groupId }];
        const mentions = post.userId === null ? [] : [{ userId: post.userId }];
        const ownerReactions =
          post.postReactionId === null
            ? []
            : [
                {
                  id: post.postReactionId,
                  reactionName: post.reactionName,
                  createdAt: post.reactCreatedAt,
                },
              ];
        const media =
          post.mediaId === null
            ? []
            : [
                {
                  id: post.mediaId,
                  url: post.url,
                  name: post.name,
                  type: post.type,
                  width: post.width,
                  size: post.size,
                  height: post.height,
                  extension: post.extension,
                },
              ];
        result.push({
          id,
          commentsCount,
          isImportant,
          importantExpiredAt,
          isDraft,
          content,
          canComment,
          markedReadPost,
          canReact,
          canShare,
          createdBy,
          updatedBy,
          createdAt,
          updatedAt,
          isNowImportant,
          groups,
          mentions,
          media,
          ownerReactions,
        });
        return;
      }
      if (post.groupId !== null && !postAdded.groups.find((g) => g.groupId === post.groupId)) {
        postAdded.groups.push({ groupId: post.groupId });
      }
      if (post.userId !== null && !postAdded.mentions.find((m) => m.userId === post.userId)) {
        postAdded.mentions.push({ userId: post.userId });
      }
      if (
        post.postReactionId !== null &&
        !postAdded.ownerReactions.find((m) => m.id === post.postReactionId)
      ) {
        postAdded.ownerReactions.push({
          id: post.postReactionId,
          reactionName: post.reactionName,
          createdAt: post.reactCreatedAt,
        });
      }
      if (post.mediaId !== null && !postAdded.media.find((m) => m.id === post.mediaId)) {
        postAdded.media.push({
          id: post.mediaId,
          url: post.url,
          name: post.name,
          type: post.type,
          width: post.width,
          size: post.size,
          height: post.height,
          extension: post.extension,
        });
      }
    });
    return result;
  }
}
