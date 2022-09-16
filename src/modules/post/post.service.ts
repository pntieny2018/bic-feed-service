import { PageDto, EntityIdDto } from '../../common/dto';
import {
  HTTP_STATUS_ID,
  KAFKA_PRODUCER,
  KAFKA_TOPIC,
  MentionableType,
} from '../../common/constants';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { IPost, PostModel, PostPrivacy } from '../../database/models/post.model';
import { CreatePostDto, GetPostDto, UpdatePostDto, GetPostEditedHistoryDto } from './dto/requests';
import { BadRequestException, forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { UserDto } from '../auth';
import { MediaService } from '../media';
import { MentionService } from '../mention';
import { CommentService } from '../comment';
import { AuthorityService } from '../authority';
import { UserService } from '../../shared/user';
import { Sequelize } from 'sequelize-typescript';
import { PostResponseDto, PostEditedHistoryDto } from './dto/responses';
import { GroupService } from '../../shared/group';
import { ClassTransformer, plainToInstance } from 'class-transformer';
import { EntityType } from '../media/media.constants';
import { LogicException } from '../../common/exceptions';
import { FeedService } from '../feed/feed.service';
import { UserMarkReadPostModel } from '../../database/models/user-mark-read-post.model';
import {
  IMedia,
  MediaMarkAction,
  MediaModel,
  MediaStatus,
} from '../../database/models/media.model';
import { MentionModel } from '../../database/models/mention.model';
import { GetDraftPostDto } from './dto/requests/get-draft-posts.dto';
import { PostGroupModel } from '../../database/models/post-group.model';
import { PostReactionModel } from '../../database/models/post-reaction.model';
import { CommentModel } from '../../database/models/comment.model';
import { CommentReactionModel } from '../../database/models/comment-reaction.model';
import { ArrayHelper, ExceptionHelper } from '../../common/helpers';
import { ReactionService } from '../reaction';
import sequelize, {
  FindAttributeOptions,
  Includeable,
  Op,
  QueryTypes,
  Transaction,
} from 'sequelize';
import { getDatabaseConfig } from '../../config/database';
import { PostEditedHistoryModel } from '../../database/models/post-edited-history.model';
import { ClientKafka } from '@nestjs/microservices';
import { PostMediaModel } from '../../database/models/post-media.model';
import { SentryService } from '@app/sentry';
import { NIL } from 'uuid';
import { GroupPrivacy } from '../../shared/group/dto';
import { SeriesModel } from '../../database/models/series.model';
import { Severity } from '@sentry/node';
import { Cron, CronExpression } from '@nestjs/schedule';
import moment from 'moment';
import { PostBindingService } from './post-binding.service';
import { MediaDto } from '../media/dto';
import { up } from '../../../sequelize/migrations/20220426071342-create_post_edited_history_table';
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
    @Inject(forwardRef(() => ReactionService))
    protected reactionService: ReactionService,
    @Inject(forwardRef(() => FeedService))
    protected feedService: FeedService,
    @InjectModel(PostEditedHistoryModel)
    protected readonly postEditedHistoryModel: typeof PostEditedHistoryModel,
    @Inject(KAFKA_PRODUCER)
    protected readonly client: ClientKafka,
    protected readonly sentryService: SentryService,
    protected readonly postBinding: PostBindingService
  ) {}

  /**
   * Get Draft Posts
   * @param authUserId auth user ID
   * @param getDraftPostDto GetDraftPostDto
   * @returns Promise resolve PageDto<PostResponseDto>
   * @throws HttpException
   */
  public async getDrafts(
    authUserId: string,
    getDraftPostDto: GetDraftPostDto
  ): Promise<PageDto<PostResponseDto>> {
    const { limit, offset, order, isProcessing } = getDraftPostDto;
    const condition = {
      createdBy: authUserId,
      isDraft: true,
    };

    if (isProcessing !== null) condition['isProcessing'] = isProcessing;

    const attributes = this.getAttributesObj({ loadMarkRead: false });
    const include = this.getIncludeObj({
      shouldIncludeOwnerReaction: false,
      shouldIncludeGroup: true,
      shouldIncludeMention: true,
      shouldIncludeMedia: true,
    });
    const { rows, count } = await this.postModel.findAndCountAll<PostModel>({
      where: condition,
      attributes,
      include,
      order: [['createdAt', order]],
      offset,
      limit,
    });
    const jsonPosts = rows.map((r) => r.toJSON());
    const result = await this.postBinding.bindRelatedData(jsonPosts, {
      shouldBindActor: true,
      shouldBindMention: true,
      shouldBindAudience: true,
      shouldHideSecretAudienceCanNotAccess: false,
    });
    return new PageDto<PostResponseDto>(result, {
      total: count,
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
  public async get(
    postId: string,
    user: UserDto,
    getPostDto?: GetPostDto
  ): Promise<PostResponseDto> {
    const attributes = this.getAttributesObj({ loadMarkRead: true, authUserId: user.id });
    const include = this.getIncludeObj({
      shouldIncludeOwnerReaction: true,
      shouldIncludeGroup: true,
      shouldIncludeMention: true,
      shouldIncludeMedia: true,
      authUserId: user.id,
    });
    const post = await this.postModel.findOne({
      attributes,
      where: { id: postId, [Op.or]: [{ isDraft: false }, { isDraft: true, createdBy: user.id }] },
      include,
    });
    if (!post) {
      throw new LogicException(HTTP_STATUS_ID.APP_POST_NOT_EXISTING);
    }

    if (user) {
      await this.authorityService.checkCanReadPost(user, post);
    } else {
      await this.authorityService.checkIsPublicPost(post);
    }

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
    const rows = await this.postBinding.bindRelatedData([jsonPost], {
      shouldBindReation: true,
      shouldBindActor: true,
      shouldBindMention: true,
      shouldBindAudience: true,
      shouldHideSecretAudienceCanNotAccess: true,
      authUser: null,
    });

    rows[0]['comments'] = comments;
    return rows[0];
  }

  protected getAttributesObj(options?: {
    loadMarkRead?: boolean;
    authUserId?: string;
  }): FindAttributeOptions {
    const attributes: FindAttributeOptions = { exclude: ['updatedBy'] };
    if (options?.authUserId && options?.loadMarkRead) {
      attributes.include = [PostModel.loadMarkReadPost(options.authUserId)];
    }

    return attributes;
  }

  protected getIncludeObj({
    shouldIncludeOwnerReaction,
    shouldIncludeGroup,
    shouldIncludeMention,
    shouldIncludeMedia,
    authUserId,
  }: {
    shouldIncludeOwnerReaction?: boolean;
    shouldIncludeGroup?: boolean;
    shouldIncludeMention?: boolean;
    shouldIncludeMedia?: boolean;
    authUserId?: string;
  }): Includeable[] {
    const includes: Includeable[] = [];
    if (shouldIncludeGroup) {
      includes.push({
        model: PostGroupModel,
        as: 'groups',
        required: false,
        attributes: ['groupId'],
      });
    }

    if (shouldIncludeMention) {
      includes.push({
        model: MentionModel,
        as: 'mentions',
        required: false,
        attributes: ['userId'],
      });
    }

    if (shouldIncludeMedia) {
      includes.push({
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
      });
    }
    if (shouldIncludeOwnerReaction && authUserId) {
      includes.push({
        model: PostReactionModel,
        as: 'ownerReactions',
        required: false,
        where: {
          createdBy: authUserId,
        },
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
  public async create(authUser: UserDto, createPostDto: CreatePostDto): Promise<IPost> {
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
        await this.mediaService.createIfNotExist(media, authUserId);
        await this.mediaService.sync(post.id, EntityType.POST, uniqueMediaIds, transaction);
      }

      if (audience.groupIds.length > 0) {
        await this.addGroup(audience.groupIds, post.id, transaction);
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
  public async saveEditedHistory(
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

  public async getPrivacy(groupIds: string[]): Promise<PostPrivacy> {
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
  public async update(
    post: PostResponseDto,
    authUser: UserDto,
    updatePostDto: UpdatePostDto
  ): Promise<boolean> {
    const authUserId = authUser.id;
    let transaction;
    try {
      const { media, mentions, audience } = updatePostDto;
      const dataUpdate = await this.getDataUpdate(updatePostDto, authUserId);

      //if post is draft, isProcessing alway is true
      if (dataUpdate.isProcessing && post.isDraft === true) dataUpdate.isProcessing = false;
      transaction = await this.sequelizeConnection.transaction();
      await this.postModel.update(dataUpdate, {
        where: {
          id: post.id,
          createdBy: authUserId,
        },
        transaction,
      });

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
      await transaction.commit();

      return true;
    } catch (error) {
      if (typeof transaction !== 'undefined') await transaction.rollback();
      this.logger.error(error, error?.stack);
      throw error;
    }
  }

  protected async getDataUpdate(
    updatePostDto: UpdatePostDto,
    authUserId: string
  ): Promise<Partial<IPost>> {
    const { content, media, setting, audience } = updatePostDto;
    const dataUpdate = {
      updatedBy: authUserId,
    };
    if (audience.groupIds.length) {
      const postPrivacy = await this.getPrivacy(audience.groupIds);
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

    if (media) {
      const mediaList = await this.mediaService.createIfNotExist(media, authUserId);
      this._bindStatusByMediaList(dataUpdate, mediaList);
    }

    return dataUpdate;
  }

  private _bindStatusByMediaList(dataUpdate: Partial<IPost>, mediaList: IMedia[]): void {
    if (
      mediaList.filter(
        (m) =>
          m.status === MediaStatus.WAITING_PROCESS ||
          m.status === MediaStatus.PROCESSING ||
          m.status === MediaStatus.FAILED
      ).length > 0
    ) {
      dataUpdate['isDraft'] = true;
      dataUpdate['isProcessing'] = true;
    }
  }

  /**
   * Publish Post
   * @param postId PostID
   * @param authUserId UserID
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async publish(postId: string, authUser: UserDto): Promise<boolean> {
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
      const postPrivacy = await this.getPrivacy(groupIds);
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
  public async delete(postId: string, authUser: UserDto): Promise<IPost> {
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
        await this._cleanRelationship(postId, transaction, true);
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

  private async _cleanRelationship(
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
      this.reactionService.deleteByPostIds([postId]),
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
  public async deleteEditedHistory(postId: string): Promise<any> {
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
  public async addGroup(
    groupIds: string[],
    postId: string,
    transaction: Transaction
  ): Promise<void> {
    if (groupIds.length === 0) return;
    const postGroupDataCreate = groupIds.map((groupId) => ({
      postId: postId,
      groupId,
    }));
    await this.postGroupModel.bulkCreate(postGroupDataCreate, { transaction });
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

  public async findIdsByGroupId(groupIds: string[], take = 1000): Promise<string[]> {
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

  public async markRead(postId: string, userId: string): Promise<void> {
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
  }

  /**
   * Get post edited history
   * @param user UserDto
   * @param postId string
   * @param getPostEditedHistoryDto GetPostEditedHistoryDto
   * @returns Promise resolve PageDto
   */
  public async getEditedHistory(
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

  public async getsByMedia(id: string): Promise<PostResponseDto[]> {
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
      this.postBinding.bindAudienceToPost(jsonPosts),
      this.mentionService.bindMentionsToPosts(jsonPosts),
      this.postBinding.bindActorToPost(jsonPosts),
    ]);
    const result = this.classTransformer.plainToInstance(PostResponseDto, jsonPosts, {
      excludeExtraneousValues: true,
    });
    return result;
  }

  public async updateStatus(postId: string): Promise<void> {
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

  public checkContent(content: string, media: MediaDto): void {
    if (
      content === '' &&
      media?.files.length === 0 &&
      media?.videos.length === 0 &&
      media?.images.length === 0
    ) {
      throw new LogicException(HTTP_STATUS_ID.APP_POST_PUBLISH_CONTENT_EMPTY);
    }
  }

  public async updatePrivacy(postId: string): Promise<void> {
    const post = await this.findPost({ postId });
    const groupIds = post.groups.map((g) => g.groupId);
    const privacy = await this.getPrivacy(groupIds);
    await this.postModel.update(
      { privacy },
      {
        where: {
          id: postId,
        },
      }
    );
  }

  public group(posts: any[]): any[] {
    const result = [];
    posts.forEach((post) => {
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
        result.push({ ...post, groups, mentions, ownerReactions, media });
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

  public async updateData(postIds: string[], data: Partial<IPost>): Promise<void> {
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
        await this._cleanRelationship(post.id, transaction, true);
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
          await this._cleanRelationship(post.id, transaction, true);
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
