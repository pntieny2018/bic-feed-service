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
import { ExceptionHelper } from '../../common/helpers';
import { ReactionService } from '../reaction';
import { SentryService } from '../../../libs/sentry/src';
import { CreateArticleDto } from './dto/requests/create-article.dto';
import { ArticleResponseDto } from './dto/responses/article.response.dto';
import { UpdateArticleDto } from './dto/requests/update-article.dto';
import { GetArticleDto } from './dto/requests/get-article.dto';
import { ClassTransformer } from 'class-transformer';
import { PostService } from '../post/post.service';
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
   * Get Post
   * @param postId number
   * @param user UserDto
   * @param getPostDto GetPostDto
   * @returns Promise resolve PostResponseDto
   * @throws HttpException
   */
  public async getArticle(
    postId: string,
    user: UserDto,
    getArticleDto?: GetArticleDto
  ): Promise<any> {
    return this._postService.getPost(postId, user, getArticleDto);
  }

  /**
   * Get Public Post
   * @param postId number
   * @param user UserDto
   * @param getArticleDto GetArticleDto
   * @returns Promise resolve ArticleResponseDto
   * @throws HttpException
   */
  public async getPublicArticle(postId: string, getArticleDto?: GetArticleDto): Promise<any> {}

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
