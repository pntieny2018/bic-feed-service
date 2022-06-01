import { HTTP_STATUS_ID, MentionableType } from '../../common/constants';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { PostModel } from '../../database/models/post.model';
import { Injectable, Logger } from '@nestjs/common';
import { UserDto } from '../auth';
import { MediaService } from '../media';
import { MentionService } from '../mention';
import { CommentService } from '../comment';
import { AuthorityService } from '../authority';
import { Sequelize } from 'sequelize-typescript';
import { ElasticsearchHelper, ExceptionHelper } from '../../common/helpers';
import { ReactionService } from '../reaction';
import { SentryService } from '../../../libs/sentry/src';
import { CreateArticleDto } from './dto/requests/create-article.dto';
import { ArticleResponseDto } from './dto/responses/article.response.dto';
import { UpdateArticleDto } from './dto/requests/update-article.dto';
import { GetArticleDto } from './dto/requests/get-article.dto';
import { ClassTransformer } from 'class-transformer';
import { PostService } from '../post/post.service';
import { PageDto } from '../../common/dto';
import { SearchArticlesDto } from './dto/requests/search-article.dto';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { EntityType } from '../media/media.constants';
import { CategoryService } from '../category/category.service';
import { SeriesService } from '../series/series.service';
import { HashtagService } from '../hashtag/hashtag.service';
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
    private readonly _commentService: CommentService,
    private readonly _reactionService: ReactionService,
    private readonly _mentionService: MentionService,
    private readonly _mediaService: MediaService,
    private readonly _categoryService: CategoryService,
    private readonly _seriesService: SeriesService,
    private readonly _hashtagService: HashtagService,
    private readonly _authorityService: AuthorityService,
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
    const response = await this.searchService.search(payload);
    const hits = response.body.hits.hits;
    const posts = hits.map((item) => {
      const source = item._source;
      source['id'] = item._id;
      return source;
    });

    await Promise.all([
      this.postService.bindActorToPost(posts),
      this.postService.bindAudienceToPost(posts),
      this.postService.bindCommentsCount(posts),
    ]);

    const result = this.classTransformer.plainToInstance(ArticleResponseDto, posts, {
      excludeExtraneousValues: true,
    });

    return new PageDto<ArticleResponseDto>(result, {
      total: response.body.hits.total.value,
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
    const post = await this.postService.getPost(postId, user, getArticleDto);
    const categories = [];
    const series = [];
    const article = this.classTransformer.plainToInstance(
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
    const post = await this.postService.getPublicPost(postId, getArticleDto);
    const categories = [];
    const series = [];
    const article = this.classTransformer.plainToInstance(
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
          isDraft: false,
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
  public async publishArticle(articleId: string, authUserId: number): Promise<boolean> {
    return this._postService.publishPost(articleId, authUserId);
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
      const { content, media, setting, mentions, audience, series, categories } = updateArticleDto;
      if (post.isDraft === false) {
        await this._postService.checkContent(updateArticleDto);
      }
      await this._postService.checkPostOwner(post, authUser.id);
      // await transaction.commit();

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
}
