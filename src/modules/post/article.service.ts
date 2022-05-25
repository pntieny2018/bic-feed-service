import { PageDto } from '../../common/dto';
import {
  HTTP_STATUS_ID,
  KAFKA_PRODUCER,
  KAFKA_TOPIC,
  MentionableType,
} from '../../common/constants';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { IPost, PostModel } from '../../database/models/post.model';
import { CreatePostDto, GetPostDto, SearchPostsDto, UpdatePostDto } from './dto/requests';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { UserDto } from '../auth';
import { MediaService } from '../media';
import { MentionService } from '../mention';
import { CommentService } from '../comment';
import { AuthorityService } from '../authority';
import { UserService } from '../../shared/user';
import { Sequelize } from 'sequelize-typescript';
import { PostResponseDto } from './dto/responses';
import { GroupService } from '../../shared/group';
import { ClassTransformer } from 'class-transformer';
import { EntityType } from '../media/media.constants';
import { LogicException } from '../../common/exceptions';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { FeedService } from '../feed/feed.service';
import { UserMarkReadPostModel } from '../../database/models/user-mark-read-post.model';
import { MediaModel, MediaStatus } from '../../database/models/media.model';
import { MentionModel } from '../../database/models/mention.model';
import { GetDraftPostDto } from './dto/requests/get-draft-posts.dto';
import { PostGroupModel } from '../../database/models/post-group.model';
import { PostReactionModel } from '../../database/models/post-reaction.model';
import { EntityIdDto } from '../../common/dto';
import { CommentModel } from '../../database/models/comment.model';
import { CommentReactionModel } from '../../database/models/comment-reaction.model';
import { ArrayHelper, ElasticsearchHelper, ExceptionHelper } from '../../common/helpers';
import { ReactionService } from '../reaction';
import { plainToInstance } from 'class-transformer';
import { Op, QueryTypes, Transaction } from 'sequelize';
import { getDatabaseConfig } from '../../config/database';
import { PostEditedHistoryModel } from '../../database/models/post-edited-history.model';
import { GetPostEditedHistoryDto } from './dto/requests';
import { PostEditedHistoryDto } from './dto/responses';
import { ClientKafka } from '@nestjs/microservices';
import { ProcessVideoResponseDto } from './dto/responses/process-video-response.dto';
import { PostMediaModel } from '../../database/models/post-media.model';
import { SentryService } from '../../../libs/sentry/src';

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
    private _postModel: typeof PostModel,
    @InjectModel(PostGroupModel)
    private _postGroupModel: typeof PostGroupModel,
    @InjectModel(UserMarkReadPostModel)
    private _userMarkReadPostModel: typeof UserMarkReadPostModel,
    private _userService: UserService,
    private _groupService: GroupService,
    private _mediaService: MediaService,
    private _mentionService: MentionService,
    @Inject(forwardRef(() => CommentService))
    private _commentService: CommentService,
    private _authorityService: AuthorityService,
    private _searchService: ElasticsearchService,
    private _reactionService: ReactionService,
    @Inject(forwardRef(() => FeedService))
    private _feedService: FeedService,
    @InjectModel(PostEditedHistoryModel)
    private readonly _postEditedHistoryModel: typeof PostEditedHistoryModel,
    @Inject(KAFKA_PRODUCER)
    private readonly _client: ClientKafka,
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
    postId: number,
    user: UserDto,
    getPostDto?: GetPostDto
  ): Promise<PostResponseDto> {
    const post = await this._postModel.findOne({
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
          attributes: ['id', 'url', 'type', 'name', 'width', 'height', 'status', 'uploadId'],
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
    await this._authorityService.checkCanReadPost(user, post);
    let comments = null;
    if (getPostDto.withComment) {
      comments = await this._commentService.getComments(
        {
          postId,
          childLimit: getPostDto.childCommentLimit,
          order: getPostDto.commentOrder,
          childOrder: getPostDto.childCommentOrder,
          limit: getPostDto.commentLimit,
        },
        user,
        false
      );
    }
    const jsonPost = post.toJSON();
    await Promise.all([
      this._reactionService.bindReactionToPosts([jsonPost]),
      this._mentionService.bindMentionsToPosts([jsonPost]),
      this.bindActorToPost([jsonPost]),
      this.bindAudienceToPost([jsonPost]),
    ]);

    const result = this._classTransformer.plainToInstance(PostResponseDto, jsonPost, {
      excludeExtraneousValues: true,
    });
    result['comments'] = comments;
    return result;
  }

  /**
   * Get Public Post
   * @param postId number
   * @param user UserDto
   * @param getPostDto GetPostDto
   * @returns Promise resolve PostResponseDto
   * @throws HttpException
   */
  public async getPublicPost(postId: number, getPostDto?: GetPostDto): Promise<PostResponseDto> {
    const post = await this._postModel.findOne({
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
          attributes: ['id', 'url', 'type', 'name', 'width', 'height', 'status', 'uploadId'],
        },
      ],
    });

    if (!post) {
      throw new LogicException(HTTP_STATUS_ID.APP_POST_NOT_FOUND);
    }
    await this._authorityService.checkPublicPost(post);
    let comments = null;
    if (getPostDto.withComment) {
      comments = await this._commentService.getComments({
        postId,
        childLimit: getPostDto.childCommentLimit,
        order: getPostDto.commentOrder,
        childOrder: getPostDto.childCommentOrder,
        limit: getPostDto.commentLimit,
      });
    }
    const jsonPost = post.toJSON();
    await Promise.all([
      this._reactionService.bindReactionToPosts([jsonPost]),
      this._mentionService.bindMentionsToPosts([jsonPost]),
      this.bindActorToPost([jsonPost]),
      this.bindAudienceToPost([jsonPost]),
    ]);

    const result = this._classTransformer.plainToInstance(PostResponseDto, jsonPost, {
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
  public async createPost(authUser: UserDto, createPostDto: CreatePostDto): Promise<IPost> {
    let transaction;
    try {
      const { content, media, setting, mentions, audience } = createPostDto;
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
      transaction = await this._sequelizeConnection.transaction();
      const post = await this._postModel.create(
        {
          isDraft: true,
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
        await this._mediaService.sync(post.id, EntityType.POST, uniqueMediaIds, transaction);
      }

      await this.addPostGroup(groupIds, post.id, transaction);

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
   * Update Post except isDraft
   * @param postId postID
   * @param authUser UserDto
   * @param updatePostDto UpdatePostDto
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async updatePost(
    post: PostResponseDto,
    authUser: UserDto,
    updatePostDto: UpdatePostDto
  ): Promise<boolean> {
    const authUserId = authUser.id;
    const creator = authUser.profile;
    if (!creator) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_USER_NOT_FOUND);
    }

    let transaction;
    try {
      const { content, media, setting, mentions, audience } = updatePostDto;
      if (post.isDraft === false) {
        await this.checkContent(updatePostDto);
      }
      await this.checkPostOwner(post, authUser.id);
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
      transaction = await this._sequelizeConnection.transaction();
      if (media) {
        const { files, images, videos } = media;
        newMediaIds = [...new Set([...files, ...images, ...videos].map((i) => i.id))];
        await this._mediaService.checkValidMedia(newMediaIds, authUserId);
        const mediaList =
          newMediaIds.length === 0
            ? []
            : await this._mediaService.getMediaList({ where: { id: newMediaIds } });
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
        await this.setGroupByPost(audience.groupIds, post.id, transaction);
      }
      await transaction.commit();

      return true;
    } catch (error) {
      if (typeof transaction !== 'undefined') await transaction.rollback();
      this._logger.error(error, error?.stack);
      throw error;
    }
  }
}
