import { HTTP_STATUS_ID, KAFKA_PRODUCER, MentionableType } from '../../common/constants';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { IPost, PostModel } from '../../database/models/post.model';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { UserDto } from '../auth';
import { MediaService } from '../media';
import { MentionService } from '../mention';
import { CommentService } from '../comment';
import { AuthorityService } from '../authority';
import { UserService } from '../../shared/user';
import { Sequelize } from 'sequelize-typescript';
import { GroupService } from '../../shared/group';
import { EntityType } from '../media/media.constants';
import { LogicException } from '../../common/exceptions';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { FeedService } from '../feed/feed.service';
import { UserMarkReadPostModel } from '../../database/models/user-mark-read-post.model';
import { MediaModel, MediaStatus } from '../../database/models/media.model';
import { MentionModel } from '../../database/models/mention.model';
import { PostGroupModel } from '../../database/models/post-group.model';
import { PostReactionModel } from '../../database/models/post-reaction.model';
import { ArrayHelper, ExceptionHelper } from '../../common/helpers';
import { ReactionService } from '../reaction';
import { PostEditedHistoryModel } from '../../database/models/post-edited-history.model';
import { ClientKafka } from '@nestjs/microservices';
import { SentryService } from '../../../libs/sentry/src';
import { PostService } from './post.service';
import { CreateArticleDto } from './dto/requests/create-article.dto';
import { ArticleResponseDto } from './dto/responses/article.response.dto';
import { UpdateArticleDto } from './dto/requests/update-article.dto';
import { GetArticleDto } from './dto/requests/get-article.dto';
@Injectable()
export class ArticleService extends PostService {
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
    protected searchService: ElasticsearchService,
    protected reactionService: ReactionService,
    @Inject(forwardRef(() => FeedService))
    protected feedService: FeedService,
    @InjectModel(PostEditedHistoryModel)
    protected readonly postEditedHistoryModel: typeof PostEditedHistoryModel,
    @Inject(KAFKA_PRODUCER)
    protected readonly client: ClientKafka,
    protected readonly sentryService: SentryService
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
      searchService,
      reactionService,
      feedService,
      postEditedHistoryModel,
      client,
      sentryService
    );
  }

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
  ): Promise<ArticleResponseDto> {
    const post = await this.postModel.findOne({
      attributes: {
        exclude: ['updatedBy'],
        include: [PostModel.loadMarkReadPost(user.id)],
      },
      where: { id: postId },
      include: [
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
    await this.authorityService.checkCanReadPost(user, post);
    let comments = null;
    if (getArticleDto.withComment) {
      comments = await this.commentService.getComments(
        {
          postId,
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
      this.reactionService.bindReactionToPosts([jsonPost]),
      this.mentionService.bindMentionsToPosts([jsonPost]),
      this.bindActorToPost([jsonPost]),
      this.bindAudienceToPost([jsonPost]),
    ]);

    const result = this.classTransformer.plainToInstance(ArticleResponseDto, jsonPost, {
      excludeExtraneousValues: true,
    });
    result['comments'] = comments;
    return result;
  }

  /**
   * Get Public Post
   * @param postId number
   * @param user UserDto
   * @param getArticleDto GetArticleDto
   * @returns Promise resolve ArticleResponseDto
   * @throws HttpException
   */
  public async getPublicArticle(
    postId: string,
    getArticleDto?: GetArticleDto
  ): Promise<ArticleResponseDto> {
    const post = await this.postModel.findOne({
      attributes: {
        exclude: ['updatedBy'],
      },
      where: { id: postId },
      include: [
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
    await this.authorityService.checkPublicPost(post);
    let comments = null;
    if (getArticleDto.withComment) {
      comments = await this.commentService.getComments({
        postId,
        childLimit: getArticleDto.childCommentLimit,
        order: getArticleDto.commentOrder,
        childOrder: getArticleDto.childCommentOrder,
        limit: getArticleDto.commentLimit,
      });
    }
    const jsonPost = post.toJSON();
    await Promise.all([
      this.reactionService.bindReactionToPosts([jsonPost]),
      this.mentionService.bindMentionsToPosts([jsonPost]),
      this.bindActorToPost([jsonPost]),
      this.bindAudienceToPost([jsonPost]),
    ]);

    const result = this.classTransformer.plainToInstance(ArticleResponseDto, jsonPost, {
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
  public async createArticle(
    authUser: UserDto,
    createArticleDto: CreateArticleDto
  ): Promise<IPost> {
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
      await this.authorityService.checkCanCreatePost(authUser, groupIds);

      if (categories && categories.length) {
        //TODO
        //await this.mentionService.checkValidMentions(groupIds, mentions);
      }

      if (hashtags && hashtags.length) {
        //TODO
        //await this.mentionService.checkValidMentions(groupIds, mentions);
      }

      if (series && series.length) {
        //TODO
        //await this.mentionService.checkValidMentions(groupIds, mentions);
      }

      if (mentions && mentions.length) {
        await this.mentionService.checkValidMentions(groupIds, mentions);
      }

      const { files, images, videos } = media;
      const uniqueMediaIds = [...new Set([...files, ...images, ...videos].map((i) => i.id))];
      await this.mediaService.checkValidMedia(uniqueMediaIds, authUserId);
      transaction = await this.sequelizeConnection.transaction();
      const post = await this.postModel.create(
        {
          title,
          summary,
          isDraft: false,
          content,
          createdBy: authUserId,
          updatedBy: authUserId,
          isImportant: setting.isImportant,
          importantExpiredAt: setting.isImportant === false ? null : setting.importantExpiredAt,
          canShare: setting.canShare,
          canComment: setting.canComment,
          canReact: setting.canReact,
          isProcessing: false,
          isArticle: true,
          views: 0,
        },
        { transaction }
      );
      if (uniqueMediaIds.length) {
        await this.mediaService.sync(post.id, EntityType.POST, uniqueMediaIds, transaction);
      }

      await this.addPostGroup(groupIds, post.id, transaction);

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
      this.logger.error(error, error?.stack);
      this.sentryService.captureException(error);
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
      const { content, media, setting, mentions, audience, series, categories } = updateArticleDto;
      if (post.isDraft === false) {
        await this.checkContent(updateArticleDto);
      }
      await this.checkPostOwner(post, authUser.id);
      const oldGroupIds = post.audience.groups.map((group) => group.id);
      if (audience) {
        await this.authorityService.checkCanUpdatePost(authUser, audience.groupIds);
      }

      if (mentions && mentions.length) {
        await this.mentionService.checkValidMentions(
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
      if (setting.hasOwnProperty('canShare')) {
        dataUpdate['canShare'] = setting.canShare;
      }
      if (setting.hasOwnProperty('canComment')) {
        dataUpdate['canComment'] = setting.canComment;
      }
      if (setting.hasOwnProperty('canReact')) {
        dataUpdate['canReact'] = setting.canReact;
      }
      if (setting.hasOwnProperty('isImportant')) {
        dataUpdate['isImportant'] = setting.isImportant;
      }
      if (setting.hasOwnProperty('importantExpiredAt')) {
        dataUpdate['importantExpiredAt'] =
          setting.isImportant === false ? null : setting.importantExpiredAt;
      }
      let newMediaIds = [];
      transaction = await this.sequelizeConnection.transaction();
      if (media) {
        const { files, images, videos } = media;
        newMediaIds = [...new Set([...files, ...images, ...videos].map((i) => i.id))];
        await this.mediaService.checkValidMedia(newMediaIds, authUserId);
        const mediaList =
          newMediaIds.length === 0
            ? []
            : await this.mediaService.getMediaList({ where: { id: newMediaIds } });
        if (
          mediaList.filter(
            (m) => m.status === MediaStatus.WAITING_PROCESS || m.status === MediaStatus.PROCESSING
          ).length > 0
        ) {
          dataUpdate['isDraft'] = true;
          dataUpdate['isProcessing'] = post.isDraft === true ? false : true;
        }
      }

      await this.postModel.update(dataUpdate, {
        where: {
          id: post.id,
          createdBy: authUserId,
        },
        transaction,
      });

      if (media) {
        await this.mediaService.sync(post.id, EntityType.POST, newMediaIds, transaction);
      }

      if (mentions) {
        await this.mentionService.setMention(mentions, MentionableType.POST, post.id, transaction);
      }
      if (audience && !ArrayHelper.arraysEqual(audience.groupIds, oldGroupIds)) {
        await this.setGroupByPost(audience.groupIds, post.id, transaction);
      }
      await transaction.commit();

      return true;
    } catch (error) {
      if (typeof transaction !== 'undefined') await transaction.rollback();
      this.logger.error(error, error?.stack);
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
  public deleteArticle(id: string, user: UserDto): Promise<IPost> {
    return this.deletePost(id, user);
  }
}
