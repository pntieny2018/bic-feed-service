import { PageDto } from '../../common/dto';
import {
  HTTP_STATUS_ID,
  KAFKA_PRODUCER,
  KAFKA_TOPIC,
  MentionableType,
} from '../../common/constants';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { IPost, PostModel, PostPrivacy } from '../../database/models/post.model';
import { CreatePostDto, GetPostDto, SearchPostsDto, UpdatePostDto } from './dto/requests';
import { BadRequestException, forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
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
import { FeedService } from '../feed/feed.service';
import { UserMarkReadPostModel } from '../../database/models/user-mark-read-post.model';
import { MediaMarkAction, MediaModel, MediaStatus } from '../../database/models/media.model';
import { MentionModel } from '../../database/models/mention.model';
import { GetDraftPostDto } from './dto/requests/get-draft-posts.dto';
import { PostGroupModel } from '../../database/models/post-group.model';
import { PostReactionModel } from '../../database/models/post-reaction.model';
import { EntityIdDto } from '../../common/dto';
import { CommentModel } from '../../database/models/comment.model';
import { CommentReactionModel } from '../../database/models/comment-reaction.model';
import {
  ArrayHelper,
  ElasticsearchHelper,
  ExceptionHelper,
  StringHelper,
} from '../../common/helpers';
import { ReactionService } from '../reaction';
import { plainToInstance } from 'class-transformer';
import { Op, QueryTypes, Transaction } from 'sequelize';
import { getDatabaseConfig } from '../../config/database';
import { PostEditedHistoryModel } from '../../database/models/post-edited-history.model';
import { GetPostEditedHistoryDto } from './dto/requests';
import { PostEditedHistoryDto } from './dto/responses';
import sequelize from 'sequelize';
import { ClientKafka } from '@nestjs/microservices';
import { PostMediaModel } from '../../database/models/post-media.model';
import { SentryService } from '@app/sentry';
import { NIL } from 'uuid';
import { GroupPrivacy } from '../../shared/group/dto';
import { SeriesModel } from '../../database/models/series.model';
import { Severity } from '@sentry/node';
import { Cron, CronExpression } from '@nestjs/schedule';
import moment from 'moment';
@Injectable()
export class PostService {
  /**
   * Logger
   * @protected
   */
  protected logger = new Logger(PostService.name);

  /**
   *  ClassTransformer
   * @protected
   */
  protected classTransformer = new ClassTransformer();

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
    protected readonly sentryService: SentryService
  ) {}

  /**
   * Get Draft Posts
   * @param authUserId auth user ID
   * @param getDraftPostDto GetDraftPostDto
   * @returns Promise resolve PageDto<PostResponseDto>
   * @throws HttpException
   */
  public async getDraftPosts(
    authUserId: string,
    getDraftPostDto: GetDraftPostDto
  ): Promise<PageDto<PostResponseDto>> {
    const { limit, offset, order, isProcessing } = getDraftPostDto;
    const condition = {
      createdBy: authUserId,
      isDraft: true,
    };

    if (isProcessing !== null) condition['isProcessing'] = isProcessing;
    const rows = await this.postModel.findAll<PostModel>({
      where: condition,
      attributes: {
        exclude: ['commentsCount'],
      },
      include: [
        {
          model: PostGroupModel,
          attributes: ['groupId'],
          required: false,
        },
        {
          model: MediaModel,
          through: {
            attributes: [],
          },
          attributes: [
            'id',
            'url',
            'type',
            'name',
            'width',
            'height',
            'size',
            'thumbnails',
            'createdAt',
            'status',
            'mimeType',
          ],
          required: false,
        },
        {
          model: MentionModel,
          required: false,
        },
      ],
      order: [['createdAt', order]],
    });
    const jsonPostsFilterByMediaStatus = rows
      .map((r) => r.toJSON())
      .filter((row) => {
        if (getDraftPostDto.isFailed === null) return true;
        const failedItem = row.media.find((e) => e.status === MediaStatus.FAILED);
        return (
          (failedItem && getDraftPostDto.isFailed) || (!failedItem && !getDraftPostDto.isFailed)
        );
      });
    const total = jsonPostsFilterByMediaStatus.length;
    const rowsSliced = jsonPostsFilterByMediaStatus.slice(offset, limit + offset);

    await Promise.all([
      this.mentionService.bindMentionsToPosts(rowsSliced),
      this.bindActorToPost(rowsSliced),
      this.bindAudienceToPost(rowsSliced),
    ]);
    const result = this.classTransformer.plainToInstance(PostResponseDto, rowsSliced, {
      excludeExtraneousValues: true,
    });

    return new PageDto<PostResponseDto>(result, {
      total,
      limit,
      offset,
    });
  }

  /**
   * Get Post
   * @param postId string
   * @param user UserDto
   * @param getPostDto GetPostDto
   * @returns Promise resolve PostResponseDto
   * @throws HttpException
   */
  public async getPost(
    postId: string,
    user: UserDto,
    getPostDto?: GetPostDto
  ): Promise<PostResponseDto> {
    const post = await this.postModel.findOne({
      attributes: {
        exclude: ['updatedBy'],
        include: [PostModel.loadMarkReadPost(user.id)],
      },
      where: { id: postId, [Op.or]: [{ isDraft: false }, { isDraft: true, createdBy: user.id }] },
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
          attributes: [
            'id',
            'url',
            'size',
            'extension',
            'type',
            'name',
            'originName',
            'width',
            'height',
            'status',
            'mimeType',
            'thumbnails',
            'createdAt',
          ],
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
      throw new LogicException(HTTP_STATUS_ID.APP_POST_NOT_EXISTING);
    }
    await this.authorityService.checkCanReadPost(user, post);
    let comments = null;
    if (getPostDto.withComment && post.canComment) {
      comments = await this.commentService.getComments(
        {
          postId,
          parentId: NIL,
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
      this.reactionService.bindReactionToPosts([jsonPost]),
      this.mentionService.bindMentionsToPosts([jsonPost]),
      this.bindActorToPost([jsonPost]),
      this.bindAudienceToPost([jsonPost]),
    ]);

    const result = this.classTransformer.plainToInstance(PostResponseDto, jsonPost, {
      excludeExtraneousValues: true,
    });
    result['comments'] = comments;
    return result;
  }

  /**
   * Get Public Post
   * @param postId string
   * @param user UserDto
   * @param getPostDto GetPostDto
   * @returns Promise resolve PostResponseDto
   * @throws HttpException
   */
  public async getPublicPost(postId: string, getPostDto?: GetPostDto): Promise<PostResponseDto> {
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
          attributes: [
            'id',
            'url',
            'type',
            'name',
            'size',
            'width',
            'height',
            'status',
            'mimeType',
            'thumbnails',
            'createdAt',
          ],
        },
      ],
    });

    if (!post) {
      throw new LogicException(HTTP_STATUS_ID.APP_POST_NOT_EXISTING);
    }
    await this.authorityService.checkIsPublicPost(post);
    let comments = null;
    if (getPostDto.withComment) {
      comments = await this.commentService.getComments({
        postId,
        parentId: NIL,
        childLimit: getPostDto.childCommentLimit,
        order: getPostDto.commentOrder,
        childOrder: getPostDto.childCommentOrder,
        limit: getPostDto.commentLimit,
      });
    }
    const jsonPost = post.toJSON();
    await Promise.all([
      this.reactionService.bindReactionToPosts([jsonPost]),
      this.mentionService.bindMentionsToPosts([jsonPost]),
      this.bindActorToPost([jsonPost]),
      this.bindAudienceToPost([jsonPost]),
    ]);

    const result = this.classTransformer.plainToInstance(PostResponseDto, jsonPost, {
      excludeExtraneousValues: true,
    });

    result['comments'] = comments;
    return result;
  }

  /**
   * Bind Audience To Post.Groups
   * @param posts Array of post
   * @returns Promise resolve void
   * @throws HttpException
   */

  public async bindAudienceToPost(posts: any[]): Promise<void> {
    const groupIds = [];
    for (const post of posts) {
      let postGroups = post.groups;
      if (post.audience?.groups) postGroups = post.audience?.groups; //bind for elasticsearch

      if (postGroups && postGroups.length) {
        groupIds.push(...postGroups.map((m) => m.groupId || m.id));
      }
    }
    const dataGroups = await this.groupService.getMany(groupIds);
    for (const post of posts) {
      let groups = [];
      let postGroups = post.groups;
      if (post.audience?.groups) postGroups = post.audience?.groups; //bind for elasticsearch
      if (postGroups && postGroups.length) {
        const mappedGroups = [];
        postGroups.forEach((group) => {
          const dataGroup = dataGroups.find((i) => i.id === group.id || i.id === group.groupId);
          if (dataGroup && dataGroup.child) {
            delete dataGroup.child;
          }
          if (dataGroup) mappedGroups.push(dataGroup);
        });
        groups = mappedGroups;
      }
      post.audience = { groups };
    }
  }

  /**
   * Bind Actor info to post.createdBy
   * @param posts Array of post
   * @returns Promise resolve void
   * @throws HttpException
   */
  public async bindActorToPost(posts: any[]): Promise<void> {
    const userIds = [];
    for (const post of posts) {
      if (post.actor?.id) {
        userIds.push(post.actor.id);
      } else {
        userIds.push(post.createdBy);
      }
    }
    const users = await this.userService.getMany(userIds);
    for (const post of posts) {
      if (post.actor?.id) {
        post.actor = users.find((i) => i.id === post.actor.id);
      } else {
        post.actor = users.find((i) => i.id === post.createdBy);
      }
    }
  }

  /**
   * Bind data info to post
   * @param posts Array of post
   * @param objects {commentsCount: boolean, totalUsersSeen: boolean}
   * @returns Promise resolve void
   * @throws HttpException
   */
  public async bindPostData(posts: any[], objects: any): Promise<void> {
    const postIds = [];
    for (const post of posts) {
      postIds.push(post.id);
    }
    const result = await this.postModel.findAll({
      raw: true,
      where: { id: postIds },
    });
    for (const post of posts) {
      const findPost = result.find((i) => i.id == post.id);
      if (objects?.commentsCount) post.commentsCount = findPost?.commentsCount || 0;
      if (objects?.totalUsersSeen) post.totalUsersSeen = findPost?.totalUsersSeen || 0;
      if (objects?.setting) {
        post.setting = {
          importantExpiredAt: findPost.importantExpiredAt,
          isImportant: findPost.isImportant,
          canReact: findPost.canReact,
          canShare: findPost.canShare,
          canComment: findPost.canComment,
        };
      }
    }
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

      const { files, images, videos } = media;
      const uniqueMediaIds = [...new Set([...files, ...images, ...videos].map((i) => i.id))];
      transaction = await this.sequelizeConnection.transaction();
      const post = await this.postModel.create(
        {
          isDraft: true,
          isArticle: false,
          content,
          createdBy: authUserId,
          updatedBy: authUserId,
          isImportant: setting.isImportant,
          importantExpiredAt: setting.isImportant === false ? null : setting.importantExpiredAt,
          canShare: setting.canShare,
          canComment: setting.canComment,
          canReact: setting.canReact,
          isProcessing: false,
          hashtagsJson: [],
        },
        { transaction }
      );
      if (uniqueMediaIds.length) {
        await this.mediaService.createIfNotExist(media, authUserId, transaction);
        await this.mediaService.sync(post.id, EntityType.POST, uniqueMediaIds, transaction);
      }

      if (audience.groupIds.length > 0) {
        await this.addPostGroup(audience.groupIds, post.id, transaction);
      }

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
   * Save post edited history
   * @param postId string
   * @param Object { oldData: PostResponseDto; newData: PostResponseDto }
   * @returns Promise resolve void
   */
  public async savePostEditedHistory(
    postId: string,
    { oldData, newData }: { oldData: PostResponseDto; newData: PostResponseDto }
  ): Promise<any> {
    return this.postEditedHistoryModel.create({
      postId: postId,
      editedAt: newData.updatedAt ?? newData.createdAt,
      oldData: oldData,
      newData: newData,
    });
  }

  public async getPrivacyPost(groupIds: string[]): Promise<PostPrivacy> {
    if (groupIds.length === 0) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_POST_GROUP_REQUIRED);
    }
    const groups = await this.groupService.getMany(groupIds);
    let totalPrivate = 0;
    let totalOpen = 0;
    for (const group of groups) {
      if (group.privacy === GroupPrivacy.PUBLIC) {
        return PostPrivacy.PUBLIC;
      }
      if (group.privacy === GroupPrivacy.OPEN) totalOpen++;
      if (group.privacy === GroupPrivacy.PRIVATE) totalPrivate++;
    }

    if (totalOpen > 0) return PostPrivacy.OPEN;
    if (totalPrivate > 0) return PostPrivacy.PRIVATE;
    return PostPrivacy.SECRET;
  }

  /**
   * Update Post except isDraft
   * @param postId string
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
    let transaction;
    try {
      const { content, media, setting, mentions, audience } = updatePostDto;
      const dataUpdate = {
        updatedBy: authUserId,
      };

      const oldGroupIds = post.audience.groups.map((group) => group.id);
      if (audience.groupIds.length) {
        const postPrivacy = await this.getPrivacyPost(audience.groupIds);
        dataUpdate['privacy'] = postPrivacy;
      }

      if (content !== null) {
        dataUpdate['content'] = content;
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
      transaction = await this.sequelizeConnection.transaction();

      if (media) {
        const { files, images, videos } = media;
        newMediaIds = [...new Set([...files, ...images, ...videos].map((i) => i.id))];
        const mediaList = await this.mediaService.createIfNotExist(media, authUserId, transaction);
        if (
          mediaList.filter(
            (m) =>
              m.status === MediaStatus.WAITING_PROCESS ||
              m.status === MediaStatus.PROCESSING ||
              m.status === MediaStatus.FAILED
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
      if (audience.groupIds && !ArrayHelper.arraysEqual(audience.groupIds, oldGroupIds)) {
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
   * Publish Post
   * @param postId PostID
   * @param authUserId UserID
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async publishPost(postId: string, authUser: UserDto): Promise<boolean> {
    try {
      const post = await this.postModel.findOne({
        where: {
          id: postId,
        },
        include: [
          {
            model: MediaModel,
            through: {
              attributes: [],
            },
            attributes: [
              'id',
              'url',
              'type',
              'name',
              'width',
              'height',
              'status',
              'mimeType',
              'thumbnails',
              'createdAt',
            ],
            required: false,
          },
          {
            model: PostGroupModel,
            as: 'groups',
            attributes: ['groupId'],
          },
        ],
      });
      const authUserId = authUser.id;
      await this.authorityService.checkPostOwner(post, authUserId);
      const groupIds = post.groups.map((g) => g.groupId);
      if (groupIds.length === 0) {
        throw new BadRequestException('Audience is required.');
      }
      await this.authorityService.checkCanCreatePost(authUser, groupIds, post.isImportant);
      if (post.content === '' && post.media.length === 0) {
        throw new LogicException(HTTP_STATUS_ID.APP_POST_PUBLISH_CONTENT_EMPTY);
      }

      if (post.isDraft === false) return false;

      let isDraft = false;
      let isProcessing = false;
      if (
        post.media.filter(
          (m) =>
            m.status === MediaStatus.WAITING_PROCESS ||
            m.status === MediaStatus.PROCESSING ||
            m.status === MediaStatus.FAILED
        ).length > 0
      ) {
        isDraft = true;
        isProcessing = true;
      }
      const postPrivacy = await this.getPrivacyPost(groupIds);
      await this.postModel.update(
        {
          isDraft,
          isProcessing,
          privacy: postPrivacy,
          createdAt: new Date(),
        },
        {
          where: {
            id: postId,
            createdBy: authUserId,
          },
        }
      );
      return true;
    } catch (error) {
      this.logger.error(error, error?.stack);
      throw error;
    }
  }

  /**
   * Delete post by id
   * @param postId string
   * @param authUser UserDto
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async deletePost(postId: string, authUser: UserDto): Promise<IPost> {
    const transaction = await this.sequelizeConnection.transaction();
    try {
      const post = await this.postModel.findOne({
        where: {
          id: postId,
        },
        include: [
          {
            model: PostGroupModel,
            as: 'groups',
            attributes: ['groupId'],
          },
          {
            model: SeriesModel,
            as: 'series',
            through: {
              attributes: [],
            },
            required: false,
            attributes: ['id'],
          },
        ],
      });

      if (!post) {
        ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_POST_NOT_EXISTING);
      }
      if (post.isDraft === false) {
        await this.authorityService.checkCanDeletePost(
          authUser,
          post.groups.map((g) => g.groupId),
          post.createdBy
        );
      }

      if (post.isDraft) {
        await this._cleanPostElement(postId, transaction, true);
        await this.postModel.destroy({
          where: {
            id: postId,
            createdBy: authUser.id,
          },
          transaction: transaction,
          force: true,
        });
      } else {
        await this.postModel.destroy({
          where: {
            id: postId,
            createdBy: authUser.id,
          },
          transaction: transaction,
        });
      }
      await transaction.commit();

      return post;
    } catch (error) {
      this.logger.error(error, error?.stack);
      await transaction.rollback();
      throw error;
    }
  }

  private async _cleanPostElement(
    postId: string,
    transaction: Transaction,
    isCleanMedia = false
  ): Promise<void> {
    await Promise.all([
      this.mentionService.setMention([], MentionableType.POST, postId, transaction),
      isCleanMedia
        ? this.mediaService.sync(postId, EntityType.POST, [], transaction)
        : Promise.resolve(),
      this.setGroupByPost([], postId, transaction),
      this.reactionService.deleteReactionByPostIds([postId]),
      this.commentService.deleteCommentsByPost(postId, transaction),
      this.feedService.deleteNewsFeedByPost(postId, transaction),
      this.feedService.deleteUserSeenByPost(postId, transaction),
      this.userMarkReadPostModel.destroy({ where: { postId }, transaction }),
    ]);
  }

  /**
   * Delete post edited history
   * @param postId string
   */
  public async deletePostEditedHistory(postId: string): Promise<any> {
    return this.postEditedHistoryModel.destroy({
      where: {
        postId: postId,
      },
    });
  }

  /**
   * Add group to post
   * @param groupIds Array of Group ID
   * @param postId string
   * @param transaction Transaction
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async addPostGroup(
    groupIds: string[],
    postId: string,
    transaction: Transaction
  ): Promise<boolean> {
    if (groupIds.length === 0) return true;
    const postGroupDataCreate = groupIds.map((groupId) => ({
      postId: postId,
      groupId,
    }));
    await this.postGroupModel.bulkCreate(postGroupDataCreate, { transaction });
    return true;
  }

  /**
   * Delete/Insert group by post
   * @param groupIds Array of Group ID
   * @param postId PostID
   * @param transaction Transaction
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async setGroupByPost(
    groupIds: string[],
    postId: string,
    transaction: Transaction
  ): Promise<boolean> {
    const currentGroups = await this.postGroupModel.findAll({
      where: { postId },
    });
    const currentGroupIds = currentGroups.map((i) => i.groupId);

    const deleteGroupIds = ArrayHelper.arrDifferenceElements(currentGroupIds, groupIds);
    if (deleteGroupIds.length) {
      await this.postGroupModel.destroy({
        where: { groupId: deleteGroupIds, postId },
        transaction,
      });
    }

    const addGroupIds = ArrayHelper.arrDifferenceElements(groupIds, currentGroupIds);
    if (addGroupIds.length) {
      await this.postGroupModel.bulkCreate(
        addGroupIds.map((groupId) => ({
          postId,
          groupId,
        })),
        { transaction }
      );
    }
    return true;
  }

  public async findPost(entity: EntityIdDto): Promise<IPost> {
    let conditions = {};
    if (entity.postId) {
      conditions = {
        include: [
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
        where: {
          id: entity.postId,
        },
      };
    }

    if (entity.commentId) {
      conditions = {
        include: [
          {
            model: PostGroupModel,
            as: 'groups',
          },
          {
            model: CommentModel,
            as: 'comments',
            where: {
              id: entity.commentId,
            },
          },
        ],
      };
    }
    if (entity.reactionPostId) {
      conditions = {
        include: [
          {
            model: PostGroupModel,
            as: 'groups',
          },
          {
            model: PostReactionModel,
            as: 'reactions',
            where: {
              id: entity.reactionPostId,
            },
          },
        ],
      };
    }

    if (entity.reactionCommentId) {
      conditions = {
        include: [
          {
            model: PostGroupModel,
            as: 'groups',
          },
          {
            model: CommentModel,
            as: 'comments',
            include: [
              {
                model: CommentReactionModel,
                as: 'reactions',
                where: {
                  id: entity.reactionCommentId,
                },
              },
            ],
          },
        ],
      };
    }

    const post = await this.postModel.findOne(conditions);

    if (!post) {
      throw new LogicException(HTTP_STATUS_ID.APP_POST_NOT_EXISTING);
    }
    return post.toJSON();
  }

  public async findPostIdsByGroupId(groupIds: string[], take = 1000): Promise<string[]> {
    try {
      const posts = await this.postGroupModel.findAll({
        where: {
          groupId: groupIds,
        },
        limit: take,
        order: [['createdAt', 'DESC']],
      });
      return posts.map((p) => p.postId);
    } catch (ex) {
      this.logger.error(ex, ex.stack);
      this.sentryService.captureException(ex);
      return [];
    }
  }

  public async markReadPost(postId: string, userId: string): Promise<void> {
    const post = await this.postModel.findByPk(postId);
    if (!post) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_POST_NOT_EXISTING);
    }
    if (post && post.createdBy === userId) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_POST_AS_READ_NOT_ALLOW);
    }
    const readPost = await this.userMarkReadPostModel.findOne({
      where: {
        postId,
        userId,
      },
    });
    if (!readPost) {
      await this.userMarkReadPostModel.create({
        postId,
        userId,
      });
    }
    return;
  }

  public async getTotalImportantPostInNewsFeed(
    userId: string,
    constraints: string
  ): Promise<number> {
    const { schema } = getDatabaseConfig();
    const query = `SELECT COUNT(*) as total
    FROM ${schema}.posts as p
    WHERE "p"."deleted_at" IS NULL AND "p"."is_draft" = false AND "p"."important_expired_at" > NOW()
    AND NOT EXISTS (
        SELECT 1
        FROM ${schema}.users_mark_read_posts as u
        WHERE u.user_id = :userId AND u.post_id = p.id
      )
    AND EXISTS(
        SELECT 1
        from ${schema}.user_newsfeed AS u
        WHERE u.post_id = p.id
        AND u.user_id = :userId
      )
    ${constraints}`;
    const result: any = await this.sequelizeConnection.query(query, {
      replacements: {
        userId,
      },
      type: QueryTypes.SELECT,
    });
    return result[0].total;
  }

  /**
   * Get post edited history
   * @param user UserDto
   * @param postId string
   * @param getPostEditedHistoryDto GetPostEditedHistoryDto
   * @returns Promise resolve PageDto
   */
  public async getPostEditedHistory(
    user: UserDto,
    postId: string,
    getPostEditedHistoryDto: GetPostEditedHistoryDto
  ): Promise<PageDto<PostEditedHistoryDto>> {
    const { schema } = getDatabaseConfig();
    try {
      const post = await this.findPost({ postId: postId });
      await this.authorityService.checkPostOwner(post, user.id);
      const { idGT, idGTE, idLT, idLTE, endTime, offset, limit, order } = getPostEditedHistoryDto;

      if (post.isDraft === true) {
        return new PageDto([], {
          limit: limit,
          total: 0,
        });
      }

      const conditions = {};
      conditions['postId'] = postId;

      if (idGT) {
        conditions['id'] = {
          [Op.not]: idGT,
          ...conditions['id'],
        };
        conditions['editedAt'] = {
          [Op.gte]: sequelize.literal(`
            SELECT "peh".edited_at FROM ${schema}.post_edited_history AS "peh" WHERE "peh".id = ${this.sequelizeConnection.escape(
            idGT
          )}
          `),
          ...conditions['editedAt'],
        };
      }

      if (idGTE) {
        conditions['editedAt'] = {
          [Op.gte]: sequelize.literal(`
            SELECT "peh".edited_at FROM ${schema}.post_edited_history AS "peh" WHERE "peh".id = ${this.sequelizeConnection.escape(
            idGTE
          )}
          `),
          ...conditions['editedAt'],
        };
      }

      if (idLT) {
        conditions['id'] = {
          [Op.not]: idLT,
          ...conditions['id'],
        };
        conditions['editedAt'] = {
          [Op.lte]: sequelize.literal(`
            SELECT "peh".edited_at FROM ${schema}.post_edited_history AS "peh" WHERE "peh".id = ${this.sequelizeConnection.escape(
            idLT
          )}
          `),
          ...conditions['editedAt'],
        };
      }

      if (idLTE) {
        conditions['editedAt'] = {
          [Op.lte]: sequelize.literal(`
            SELECT "peh".edited_at FROM ${schema}.post_edited_history AS "peh" WHERE "peh".id = ${this.sequelizeConnection.escape(
            idLT
          )}
          `),
          ...conditions['editedAt'],
        };
      }

      if (endTime) {
        conditions['editedAt'] = {
          [Op.lt]: endTime,
        };
      }

      const { rows, count } = await this.postEditedHistoryModel.findAndCountAll({
        where: {
          ...conditions,
        },
        order: [['id', order]],
        offset: offset,
        limit: limit,
      });

      const result = rows.map((e) => {
        const newData: PostResponseDto = e.toJSON().newData;
        return plainToInstance(
          PostEditedHistoryDto,
          {
            ...newData,
            postId: newData.id,
            editedAt: newData.updatedAt ?? newData.createdAt,
          },
          { excludeExtraneousValues: true }
        );
      });

      return new PageDto(result, {
        limit: limit,
        total: count,
      });
    } catch (e) {
      this.logger.error(e, e?.stack);
      throw e;
    }
  }

  public async getPostsByMedia(id: string): Promise<PostResponseDto[]> {
    const posts = await this.postModel.findAll({
      include: [
        {
          model: MediaModel,
          through: {
            attributes: [],
          },
          attributes: [
            'id',
            'url',
            'type',
            'name',
            'width',
            'height',
            'mimeType',
            'thumbnails',
            'createdAt',
          ],
          required: true,
          where: {
            id,
          },
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
      this.bindAudienceToPost(jsonPosts),
      this.mentionService.bindMentionsToPosts(jsonPosts),
      this.bindActorToPost(jsonPosts),
    ]);
    const result = this.classTransformer.plainToInstance(PostResponseDto, jsonPosts, {
      excludeExtraneousValues: true,
    });
    return result;
  }

  public async updatePostStatus(postId: string): Promise<void> {
    const { schema } = getDatabaseConfig();
    const postMedia = PostMediaModel.tableName;
    const post = PostModel.tableName;
    const media = MediaModel.tableName;
    const query = ` UPDATE ${schema}.${post}
                SET is_processing = tmp.is_processing, is_draft = tmp.isDraft
                FROM (
                  SELECT pm.post_id, CASE WHEN SUM ( CASE WHEN m.status = '${MediaStatus.PROCESSING}' THEN 1 ELSE 0 END 
		                ) >= 1 THEN true ELSE false END as is_processing,
                    CASE WHEN SUM ( CASE WHEN m.status = '${MediaStatus.FAILED}' OR m.status = '${MediaStatus.PROCESSING}' OR m.status = '${MediaStatus.WAITING_PROCESS}' THEN 1 ELSE 0 END 
		                ) >= 1 THEN true ELSE false END as isDraft
                  FROM ${schema}.${media} as m
                  JOIN ${schema}.${postMedia} AS pm ON pm.media_id = m.id
                  WHERE pm.post_id = :postId
                  GROUP BY pm.post_id
                ) as tmp 
                WHERE tmp.post_id = ${schema}.${post}.id`;
    await this.sequelizeConnection.query(query, {
      replacements: {
        postId,
      },
      type: QueryTypes.UPDATE,
      raw: true,
    });
  }

  public async processVideo(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    try {
      this.client.emit(KAFKA_TOPIC.STREAM.VIDEO_POST_PUBLIC, {
        key: null,
        value: JSON.stringify({ videoIds: ids }),
      });
      this.sentryService.captureMessage(
        `update to processing-- ${JSON.stringify(ids)}`,
        Severity.Debug
      );
      await this.mediaService.updateData(ids, { status: MediaStatus.PROCESSING });
    } catch (e) {
      this.logger.error(e, e?.stack);
      this.sentryService.captureException(e);
    }
  }

  public checkContent(content: string, media: any): void {
    if (
      content === '' &&
      media?.files.length === 0 &&
      media?.videos.length === 0 &&
      media?.images.length === 0
    ) {
      throw new LogicException(HTTP_STATUS_ID.APP_POST_PUBLISH_CONTENT_EMPTY);
    }
  }

  public async updatePostPrivacy(postId: string): Promise<void> {
    const post = await this.findPost({ postId });
    const groupIds = post.groups.map((g) => g.groupId);
    const privacy = await this.getPrivacyPost(groupIds);
    await this.postModel.update(
      { privacy },
      {
        where: {
          id: postId,
        },
      }
    );
  }

  public groupPosts(posts: any[]): any[] {
    const result = [];
    posts.forEach((post) => {
      const {
        id,
        commentsCount,
        totalUsersSeen,
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
        isLocked,
        title,
        summary,
        isArticle,
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
                  mimeType: post.mimeType,
                  thumbnails: post.thumbnails,
                  createdAt: post.mediaCreatedAt,
                },
              ];
        result.push({
          id,
          commentsCount,
          totalUsersSeen,
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
          isLocked,
          title,
          summary,
          isArticle,
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
          mimeType: post.mimeType,
          thumbnails: post.thumbnails,
          createdAt: post.mediaCreatedAt,
        });
      }
    });
    return result;
  }

  public getPostPrivacyByCompareGroupPrivacy(
    groupPrivacy: GroupPrivacy,
    postPrivacy: PostPrivacy
  ): PostPrivacy {
    if (groupPrivacy === GroupPrivacy.PUBLIC || postPrivacy === PostPrivacy.PUBLIC) {
      return PostPrivacy.PUBLIC;
    }
    if (groupPrivacy === GroupPrivacy.OPEN || postPrivacy === PostPrivacy.OPEN) {
      return PostPrivacy.OPEN;
    }
    if (groupPrivacy === GroupPrivacy.PRIVATE || postPrivacy === PostPrivacy.PRIVATE) {
      return PostPrivacy.PRIVATE;
    }
    return PostPrivacy.SECRET;
  }

  public async filterPostIdsNeedToUpdatePrivacy(
    postIds: string[],
    newPrivacy: PostPrivacy
  ): Promise<{ [key: string]: string[] }> {
    const relationInfo = await this.postGroupModel.findAll({
      where: { postId: { [Op.in]: postIds } },
    });
    const groupIds = [...new Set(relationInfo.map((e) => e.groupId))];
    const groupInfos = await this.groupService.getMany(groupIds);
    const groupPrivacyMapping = groupInfos.reduce((returnValue, elementValue) => {
      returnValue[elementValue.id] = elementValue.privacy;
      return returnValue;
    }, {});
    const postPrivacyMapping = relationInfo.reduce((returnValue, elementValue) => {
      if (!returnValue[elementValue.postId]) {
        returnValue[elementValue.postId] = this.getPostPrivacyByCompareGroupPrivacy(
          groupPrivacyMapping[elementValue.groupId],
          newPrivacy
        );
      } else {
        returnValue[elementValue.postId] = this.getPostPrivacyByCompareGroupPrivacy(
          groupPrivacyMapping[elementValue.groupId],
          returnValue[elementValue.postId]
        );
      }
      return returnValue;
    }, {});
    const updatedPostIds = {};
    Object.entries(postPrivacyMapping).forEach(([postId, postPrivacy]) => {
      if (!updatedPostIds[postPrivacy.toString()]) {
        updatedPostIds[postPrivacy.toString()] = [postId];
      } else {
        updatedPostIds[postPrivacy.toString()].push(postId);
      }
    });
    return updatedPostIds;
  }

  public async bulkUpdatePostPrivacy(postIds: string[], privacy: PostPrivacy): Promise<void> {
    await this.postModel.update(
      { privacy },
      {
        where: {
          id: {
            [Op.in]: postIds,
          },
        },
      }
    );
  }

  public async updatePostData(postIds: string[], data: any): Promise<void> {
    await this.postModel.update(data, {
      where: {
        id: {
          [Op.in]: postIds,
        },
      },
    });
  }

  public async deleteAPostModel(post: PostModel): Promise<any> {
    const transaction = await this.sequelizeConnection.transaction();
    try {
      if (post.isDraft) {
        await this._cleanPostElement(post.id, transaction, true);
        await post.destroy({
          force: true,
          transaction,
        });
      } else {
        await post.destroy({ transaction });
      }
      await transaction.commit();

      return post;
    } catch (error) {
      this.logger.error(error, error?.stack);
      await transaction.rollback();
      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  private async _cleanDeletedPost(): Promise<void> {
    const willDeletePosts = await this.postModel.findAll({
      where: {
        deletedAt: {
          [Op.lte]: moment().subtract(30, 'days').toDate(),
        },
      },
      paranoid: false,
      include: {
        model: MediaModel,
        through: {
          attributes: [],
        },
        attributes: ['id', 'type'],
        required: false,
      },
    });
    if (willDeletePosts.length) {
      const mediaList = ArrayHelper.arrayUnique(
        willDeletePosts.filter((e) => e.media.length).map((e) => e.media)
      );
      if (!(await this.mediaService.isExistOnPostOrComment(mediaList.map((e) => e.id)))) {
        this.mediaService.emitMediaToUploadServiceFromMediaList(mediaList, MediaMarkAction.DELETE);
      }
      const transaction = await this.sequelizeConnection.transaction();

      try {
        for (const post of willDeletePosts) {
          await this._cleanPostElement(post.id, transaction, true);
          await post.destroy({ force: true, transaction });
        }
        await transaction.commit();
      } catch (e) {
        this.logger.error(e.message);
        this.sentryService.captureException(e);
        await transaction.rollback();
      }
    }
  }
  @Cron(CronExpression.EVERY_MINUTE)
  private async _jobUpdateImportantPost(): Promise<void> {
    try {
      this.postModel.update(
        {
          isImportant: false,
          importantExpiredAt: null,
        },
        {
          where: {
            isImportant: true,
            importantExpiredAt: {
              [Op.lt]: Sequelize.literal('NOW()'),
            },
          },
          paranoid: false,
        }
      );
    } catch (e) {
      this.logger.error(e.message);
      this.sentryService.captureException(e);
    }
  }
}
