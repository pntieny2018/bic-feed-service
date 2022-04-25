import {
  CommentHasBeenCreatedEvent,
  CommentHasBeenDeletedEvent,
  CommentHasBeenUpdatedEvent,
} from '../../events/comment';

import { Op, Transaction } from 'sequelize';
import { UserDto } from '../auth';
import { PostAllow } from '../post';
import { MediaService } from '../media';
import { PageDto } from '../../common/dto';
import { MentionService } from '../mention';
import { UserService } from '../../shared/user';
import { AuthorityService } from '../authority';
import { Sequelize } from 'sequelize-typescript';
import { GroupService } from '../../shared/group';
import { PostService } from '../post/post.service';
import { CommentResponseDto } from './dto/response';
import { EntityType } from '../media/media.constants';
import { HTTP_STATUS_ID, MentionableType } from '../../common/constants';
import { UserDataShareDto } from '../../shared/user/dto';
import { MediaModel } from '../../database/models/media.model';
import { PostPolicyService } from '../post/post-policy.service';
import { CreateCommentDto, GetCommentDto } from './dto/requests';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { MentionModel } from '../../database/models/mention.model';
import { UpdateCommentDto } from './dto/requests/update-comment.dto';
import { ClassTransformer, plainToInstance } from 'class-transformer';
import { CommentModel, IComment } from '../../database/models/comment.model';
import { InternalEventEmitterService } from '../../app/custom/event-emitter';
import { CommentReactionModel } from '../../database/models/comment-reaction.model';
import { IPost, PostModel } from '../../database/models/post.model';
import { ExceptionHelper } from '../../common/helpers';
import { ReactionService } from '../reaction';
import { getDatabaseConfig } from '../../config/database';
import { FollowModel } from '../../database/models/follow.model';
import { FollowService } from '../follow';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { PostGroupModel } from '../../database/models/post-group.model';
import { LogicException } from '../../common/exceptions';

@Injectable()
export class CommentService {
  private _logger = new Logger(CommentService.name);
  private _classTransformer = new ClassTransformer();

  public constructor(
    @Inject(forwardRef(() => PostService))
    private _postService: PostService,
    private _userService: UserService,
    private _mediaService: MediaService,
    private _groupService: GroupService,
    private _mentionService: MentionService,
    private _reactionService: ReactionService,
    private _authorityService: AuthorityService,
    private _postPolicyService: PostPolicyService,
    private _eventEmitter: InternalEventEmitterService,
    @InjectConnection() private _sequelizeConnection: Sequelize,
    @InjectModel(CommentModel) private _commentModel: typeof CommentModel,
    private _followService: FollowService
  ) {}

  /**
   * Create new comment
   * @param user UserDto
   * @param createCommentDto CreateCommentDto
   * @param replyId Number
   * @return Promise resolve CommentResponseDto
   */
  public async create(
    user: UserDto,
    createCommentDto: CreateCommentDto,
    replyId = 0
  ): Promise<CommentResponseDto> {
    this._logger.debug(
      `[create] user: ${JSON.stringify(user)}, createCommentDto: ${JSON.stringify(
        createCommentDto
      )},replyId: ${replyId} `
    );

    let post;
    let isReply = false;
    if (replyId > 0) {
      isReply = true;
      const parentComment = await this._commentModel.findOne({
        include: [
          {
            model: PostModel,
            as: 'post',
            include: [
              {
                model: PostGroupModel,
                as: 'groups',
              },
            ],
          },
          {
            model: MentionModel,
            as: 'mentions',
          },
        ],
        where: {
          id: replyId,
        },
      });

      if (!parentComment || !parentComment.post) {
        ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_COMMENT_REPLY_EXISTING);
      }
      post = parentComment.toJSON().post;
    } else {
      post = await this._postService.findPost({
        postId: createCommentDto.postId,
      });
    }

    // check user can access
    this._authorityService.allowAccess(user, post);

    // check post policy
    this._postPolicyService.allow(post, PostAllow.COMMENT);

    const transaction = await this._sequelizeConnection.transaction();
    try {
      const comment = await this._commentModel.create(
        {
          createdBy: user.id,
          updatedBy: user.id,
          parentId: replyId,
          content: createCommentDto.content,
          postId: post.id,
        },
        {
          returning: true,
          transaction: transaction,
        }
      );

      const userMentionIds = createCommentDto.mentions;

      if (userMentionIds.length) {
        const groupAudienceIds = post.groups.map((g) => g.groupId);

        await this._mentionService.checkValidMentions(groupAudienceIds, userMentionIds);

        await this._mentionService.create(
          userMentionIds.map((userId) => ({
            entityId: comment.id,
            userId,
            mentionableType: MentionableType.COMMENT,
          })),
          transaction
        );
      }
      const media = [
        ...createCommentDto.media.files,
        ...createCommentDto.media.images,
        ...createCommentDto.media.videos,
      ];

      if (media.length) {
        const mediaIds = media.map((m) => m.id);

        await this._mediaService.checkValidMedia(mediaIds, user.id);

        await this._mediaService.sync(comment.id, EntityType.COMMENT, mediaIds, transaction);
      }

      await transaction.commit();

      const commentResponse = await this.getComment(user, comment.id);

      this._eventEmitter.emit(
        new CommentHasBeenCreatedEvent({
          isReply: isReply,
          post: post,
          commentResponse: commentResponse,
        })
      );

      return commentResponse;
    } catch (ex) {
      await transaction.rollback();

      throw ex;
    }
  }

  /**
   * Update comment
   * @param user UserDto
   * @param commentId Number
   * @param updateCommentDto UpdateCommentDto
   * @return Promise resolve CommentResponseDto
   */
  public async update(
    user: UserDto,
    commentId: number,
    updateCommentDto: UpdateCommentDto
  ): Promise<CommentResponseDto> {
    this._logger.debug(
      `[update] user: ${JSON.stringify(user)}, updateCommentDto: ${JSON.stringify(
        updateCommentDto
      )},commentId: ${commentId} `
    );

    const comment = await this._commentModel.findOne({
      where: {
        id: commentId,
        createdBy: user.id,
      },
    });

    if (!comment) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_COMMENT_EXISTING);
    }

    const post = await this._postService.findPost({
      postId: comment.postId,
    });

    // check user can access
    this._authorityService.allowAccess(user, post);

    // check post policy
    this._postPolicyService.allow(post, PostAllow.COMMENT);

    const oldComment = comment.toJSON();

    const transaction = await this._sequelizeConnection.transaction();

    try {
      await comment.update(
        {
          updatedBy: user.id,
          content: updateCommentDto.content,
        },
        {
          transaction: transaction,
        }
      );
      const userMentionIds = updateCommentDto.mentions;

      if (userMentionIds.length) {
        const groupAudienceIds = post.groups.map((g) => g.groupId);
        await this._mentionService.checkValidMentions(groupAudienceIds, userMentionIds);
      }
      await this._mentionService.setMention(
        userMentionIds,
        MentionableType.COMMENT,
        comment.id,
        transaction
      );

      const media = [
        ...updateCommentDto.media.files,
        ...updateCommentDto.media.images,
        ...updateCommentDto.media.videos,
      ];

      const mediaIds = media.map((m) => m.id);
      if (mediaIds.length) {
        await this._mediaService.checkValidMedia(mediaIds, user.id);
      }
      await this._mediaService.sync(comment.id, EntityType.COMMENT, mediaIds, transaction);

      const commentResponse = await this.getComment(user, commentId);

      await transaction.commit();

      this._eventEmitter.emit(
        new CommentHasBeenUpdatedEvent({
          newComment: comment.toJSON(),
          oldComment: oldComment,
          post: post,
          commentResponse: commentResponse,
        })
      );

      return commentResponse;
    } catch (ex) {
      this._logger.error(ex, ex.stack);
      await transaction.rollback();
      throw ex;
    }
  }

  /**
   * Get single comment
   * @param user UserDto
   * @param commentId Number
   * @param childLimit Number
   * @returns Promise resolve CommentResponseDto
   */
  public async getComment(
    user: UserDto,
    commentId: number,
    childLimit = 25
  ): Promise<CommentResponseDto> {
    this._logger.debug(`[getComment] commentId: ${commentId} `);

    const response = await this._commentModel.findOne({
      where: {
        id: commentId,
      },
      attributes: {
        include: [CommentModel.loadReactionsCount()],
      },
      include: [
        {
          model: MediaModel,
          through: {
            attributes: [],
          },
          required: false,
        },
        {
          model: MentionModel,
          as: 'mentions',
          required: false,
        },
        {
          model: CommentModel,
          limit: childLimit,
          required: false,
          attributes: {
            include: [CommentModel.loadReactionsCount()],
          },
          include: [
            {
              model: MediaModel,
              through: {
                attributes: [],
              },
              required: false,
            },
            {
              model: MentionModel,
              as: 'mentions',
              required: false,
            },
          ],
        },
        {
          model: CommentReactionModel,
          as: 'ownerReactions',
          required: false,
          where: {
            createdBy: user.id,
          },
        },
      ],
    });

    if (!response) {
      throw new LogicException(HTTP_STATUS_ID.APP_COMMENT_EXISTING);
    }

    const rawComment = response.toJSON();

    await this._mentionService.bindMentionsToComment([rawComment]);

    await this.bindUserToComment([rawComment]);

    return this._classTransformer.plainToInstance(CommentResponseDto, rawComment, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Get comment list
   * @param user UserDto
   * @param getCommentDto GetCommentDto
   * @param checkAccess Boolean
   * @returns Promise resolve PageDto<CommentResponseDto>
   */
  public async getComments(
    user: UserDto,
    getCommentDto: GetCommentDto,
    checkAccess = true
  ): Promise<PageDto<CommentResponseDto>> {
    this._logger.debug(
      `[getComments] user: ${JSON.stringify(user)}, getCommentDto: ${JSON.stringify(getCommentDto)}`
    );

    const conditions = {};
    const offset = {};

    if (checkAccess) {
      const post = await this._postService.findPost({
        postId: getCommentDto.postId,
      });

      await this._authorityService.allowAccess(user, post);
    }

    conditions['postId'] = getCommentDto.postId;

    conditions['parentId'] = getCommentDto.parentId ?? 0;

    if (getCommentDto.offset || getCommentDto.offset === 0) {
      offset['offset'] = getCommentDto.offset;
    }
    if (getCommentDto.idGT) {
      conditions['id'] = {
        [Op.gt]: getCommentDto.idGT,
        ...conditions['id'],
      };
    }
    if (getCommentDto.idGTE) {
      conditions['id'] = {
        [Op.gte]: getCommentDto.idGTE,
        ...conditions['id'],
      };
    }
    if (getCommentDto.idLT) {
      conditions['id'] = {
        [Op.lt]: getCommentDto.idLT,
        ...conditions['id'],
      };
    }
    if (getCommentDto.idLTE) {
      conditions['id'] = {
        [Op.lte]: getCommentDto.idLTE,
        ...conditions['id'],
      };
    }

    const { rows, count } = await this._commentModel.findAndCountAll({
      where: {
        ...conditions,
      },
      attributes: {
        include: [CommentModel.loadReactionsCount()],
      },
      include: [
        {
          model: MediaModel,
          through: {
            attributes: [],
          },
          required: false,
        },
        {
          model: MentionModel,
          required: false,
        },
        {
          model: CommentModel,
          limit: getCommentDto.childLimit,
          required: false,
          attributes: {
            include: [CommentModel.loadReactionsCount()],
          },
          include: [
            {
              model: MediaModel,
              through: {
                attributes: [],
              },
              required: false,
            },
            {
              model: MentionModel,
              as: 'mentions',
              required: false,
            },
            {
              model: CommentReactionModel,
              as: 'ownerReactions',
              required: false,
              where: {
                createdBy: user.id,
              },
            },
          ],
          order: [['createdAt', getCommentDto.order]],
        },
        {
          model: CommentReactionModel,
          as: 'ownerReactions',
          required: false,
          where: {
            createdBy: user.id,
          },
        },
      ],
      ...offset,
      limit: getCommentDto.limit,
      order: [['createdAt', getCommentDto.order]],
    });
    const response = rows.map((r) => r.toJSON());
    await this._mentionService.bindMentionsToComment(response);

    await this.bindUserToComment(response);

    const comments = this._classTransformer.plainToInstance(CommentResponseDto, response, {
      excludeExtraneousValues: true,
    });

    return new PageDto<CommentResponseDto>(comments, {
      total: count,
      limit: getCommentDto.limit,
      ...offset,
    });
  }

  /**
   * Delete single comment
   * @param user UserDto
   * @param commentId Number
   * @returns Promise resolve boolean
   */
  public async destroy(user: UserDto, commentId: number): Promise<boolean> {
    this._logger.debug(`[destroy] user: ${JSON.stringify(user)}, commentID: ${commentId}`);

    const comment = await this._commentModel.findOne({
      where: {
        id: commentId,
        createdBy: user.id,
      },
    });
    if (!comment) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_COMMENT_EXISTING);
    }

    const post = await this._postService.findPost({
      commentId: commentId,
    });
    await this._authorityService.allowAccess(user, post);

    const transaction = await this._sequelizeConnection.transaction();

    try {
      await Promise.all([
        this._mediaService.sync(commentId, EntityType.COMMENT, [], transaction),

        this._mentionService.destroy(
          {
            commentId: commentId,
          },
          transaction
        ),

        this._reactionService.deleteReactionByCommentIds([commentId], transaction),
      ]);

      await this._commentModel.destroy({
        where: {
          parentId: comment.id,
        },
        individualHooks: true,
        transaction: transaction,
      });

      await comment.destroy({ transaction });

      await transaction.commit();

      this._eventEmitter.emit(
        new CommentHasBeenDeletedEvent({
          comment: comment.toJSON(),
          post: post,
        })
      );

      return true;
    } catch (e) {
      this._logger.error(e, e.stack);
      await transaction.rollback();
    }
  }

  /**
   * Bind user info to comment list
   * @param commentsResponse  Array<IComment>
   * @returns Promise resolve void
   */
  public async bindUserToComment(commentsResponse: IComment[]): Promise<void> {
    const actorIds: number[] = [];

    for (const comment of commentsResponse) {
      actorIds.push(comment.createdBy);
      if (comment.parent) {
        actorIds.push(comment.parent.createdBy);
      }
      if (comment.child && comment.child.length) {
        for (const cm of comment.child) {
          actorIds.push(cm.createdBy);
        }
      }
    }

    const usersInfo = await this._userService.getMany(actorIds);

    const actorsInfo = plainToInstance(UserDataShareDto, usersInfo, {
      excludeExtraneousValues: true,
    });

    for (const comment of commentsResponse) {
      comment.actor = actorsInfo.find((u) => u.id === comment.createdBy);

      if (comment.parent) {
        comment.parent.actor = actorsInfo.find((u) => u.id === comment.parent.createdBy);
      }
      if (comment.child && comment.child.length) {
        for (const cm of comment.child) {
          cm.actor = actorsInfo.find((u) => u.id === cm.createdBy);
        }
      }
    }
  }

  /**
   * Delete all comments by postID
   * @param postId number
   * @param transaction Transaction
   * @returns Promise resolve boolean
   */
  public async deleteCommentsByPost(postId: number, transaction: Transaction): Promise<void> {
    const comments = await this._commentModel.findAll({
      where: { postId },
    });
    const commentIds = comments.map((i) => i.id);

    await Promise.all([
      this._mediaService.deleteMediaByEntityIds(commentIds, EntityType.COMMENT, transaction),
      this._mentionService.deleteMentionByEntityIds(
        commentIds,
        MentionableType.COMMENT,
        transaction
      ),
      this._reactionService.deleteReactionByCommentIds(commentIds, transaction),
    ]).catch((ex) => this._logger.error(ex, ex.stack));

    await this._commentModel.destroy({
      where: {
        id: {
          [Op.in]: commentIds,
        },
      },
      transaction: transaction,
    });
  }

  /**
   * Get recipient when updated comment
   * @param oldMentions Array<Number>
   * @param newMentions Array<Number>
   * @protected
   */
  public async getRecipientWhenUpdatedComment(
    oldMentions: number[] = [],
    newMentions: number[] = []
  ): Promise<{
    mentionedUserIds: number[];
  }> {
    const validMentionUserIds = newMentions.filter((userId) => !oldMentions.includes(userId));

    return {
      mentionedUserIds: validMentionUserIds,
    };
  }

  /**
   * Get recipient when reply to comment.
   *** I'll be executed when the listeners handle comment created post.
   * @param userId Number
   * @param groupIds Array<Number>
   * @param parentId Number
   * @param currentMentionedUserIds Array<Number>
   * @param limit Number
   * @protected
   * @returns Promise {commentedUserIds: number[];mentionedUserIds: number[]; }
   */
  public async getRecipientWhenRepliedComment(
    userId: number,
    groupIds: number[],
    parentId: number,
    currentMentionedUserIds: number[],
    limit = 50
  ): Promise<{
    parentCommentActor: number;
    currentMentionedUserIds: number[];
    parentMentionedUserIds: number[];
    repliedUserIds: number[];
    mentionedInRepliedCommentUserIds: number[];
  }> {
    const { schema } = getDatabaseConfig();

    const parentComment = await this._commentModel.findOne({
      include: [
        {
          model: MentionModel,
          required: false,
        },
      ],
      where: {
        id: parentId,
        createdBy: {
          [Op.in]: Sequelize.literal(
            `( select user_id from ${schema}.${
              FollowModel.tableName
            } where group_id in (${groupIds.join(',')}) )`
          ),
        },
      },
    });

    if (!parentComment) {
      ExceptionHelper.throwNotFoundException(`Parent comment ${parentId} not found`);
    }

    const recentComments = await this._commentModel.findAll({
      include: [
        {
          model: MentionModel,
          required: false,
        },
      ],
      where: {
        parentId: parentId,
        createdBy: {
          [Op.in]: Sequelize.literal(
            `( select user_id from ${schema}.${
              FollowModel.tableName
            } where group_id in (${groupIds.join(',')}) )`
          ),
        },
      },
      order: [['createdAt', 'DESC']],
      limit,
    });

    const parentMentionedUserIds = parentComment.mentions.map((m) => m.userId);

    const mentionedInRepliedCommentUserIds: number[] = [];

    const repliedUserIds = recentComments.map((c) => {
      mentionedInRepliedCommentUserIds.push(...c.mentions.map((m) => m.userId));
      return c.createdBy;
    });

    // priority
    //  1. mentioned you in a comment.
    //  2. replied to a comment you're mentioned.
    //  3. also replied to a comment you replied.
    //  4. replied to a comment you're mentioned.

    const ignoreUserId: number[] = [userId, parentComment.createdBy, ...currentMentionedUserIds];

    const filterParentMentionedUserIds = parentMentionedUserIds.filter((userId) => {
      return !ignoreUserId.includes(userId);
    });
    ignoreUserId.push(...filterParentMentionedUserIds);

    const filterRepliedUserIds = repliedUserIds.filter((userId) => {
      return !ignoreUserId.includes(userId);
    });

    ignoreUserId.push(...filterRepliedUserIds);

    const filterMentionedInRepliedCommentUserIds = mentionedInRepliedCommentUserIds.filter(
      (userId) => {
        return !ignoreUserId.includes(userId);
      }
    );

    return {
      parentCommentActor: parentComment.createdBy,
      currentMentionedUserIds: currentMentionedUserIds,
      parentMentionedUserIds: [...new Set(filterParentMentionedUserIds)],
      repliedUserIds: [...new Set(filterRepliedUserIds)],
      mentionedInRepliedCommentUserIds: [...new Set(filterMentionedInRepliedCommentUserIds)],
    };
  }

  /**
   * Get recipient when reply to comment.
   *** I'll be executed when the listeners handle comment created post.
   * @param userId Number
   * @param parentId Number
   * @param currentMentionedUserIds Array<Number>
   * @param post PostResponseDto
   * @param limit Number
   * @protected
   * @returns Promise {postOwnerId: number;mentionedPostUserId: number[]; rootCommentedUserIds: number[];rootMentionedUserIds: number[];}
   */
  public async getRecipientWhenCreatedCommentForPost(
    userId: number,
    parentId: number,
    currentMentionedUserIds: number[],
    post: IPost,
    limit = 50
  ): Promise<{
    postOwnerId: number;
    mentionedPostUserId: number[];
    rootCommentedUserIds: number[];
    rootMentionedUserIds: number[];
    currentMentionedUserIds: number[];
  }> {
    this._logger.debug(`[getRecipientWhenCreatedCommentForPost] ${JSON.stringify(post)}`);
    try {
      const { schema } = getDatabaseConfig();

      const groupIds = post.groups.map((g) => g.groupId);

      // get app comments. Ignore user request
      const rootComments = await this._commentModel.findAll({
        include: [
          {
            model: MentionModel,
            required: false,
          },
        ],
        where: {
          parentId: 0,
          postId: post.id,
          createdBy: {
            [Op.in]: Sequelize.literal(
              `( select user_id from ${schema}.${
                FollowModel.tableName
              } where group_id in (${groupIds.join(',')}) )`
            ),
          },
        },
        order: [['createdAt', 'DESC']],
        limit,
      });

      let rootMentionedUserIds: number[] = [];

      const rootCommentedUserIds: number[] = [];

      rootComments.forEach((comment) => {
        comment = comment.toJSON();
        if (!comment.mentions) {
          comment.mentions = [];
        }
        const mentionedUserInComment = comment.mentions
          .map((m) => m.userId)
          .filter((id) => id != userId && id != post.createdBy);

        rootMentionedUserIds.push(...mentionedUserInComment);
        if (comment.createdBy != userId && comment.createdBy != post.createdBy) {
          rootCommentedUserIds.push(comment.createdBy);
        }
      });

      rootMentionedUserIds = rootMentionedUserIds.filter(
        (id) => !currentMentionedUserIds.includes(id)
      );

      const mentionedUserIdsPost = post.mentions.map((m) => m.userId);

      const ignoreUserId = await this._followService.getUsersNotInGroups(
        [post.createdBy, ...mentionedUserIdsPost],
        groupIds
      );
      ignoreUserId.push(userId);

      let postOwner = post.createdBy;

      if (ignoreUserId.includes(post.createdBy)) {
        postOwner = null;
      }
      // priority
      //  1. mentioned you in a comment.
      //  2. commented to a post you're mentioned.
      //  3. also commented on a post.
      //  4. commented to a post you're mentioned.

      const filterCurrentMentionedUserIds = currentMentionedUserIds.filter(
        (userId) => !ignoreUserId.includes(userId)
      );

      ignoreUserId.push(...filterCurrentMentionedUserIds);

      const filterMentionedPostUserId = mentionedUserIdsPost.filter((userId) => {
        return !ignoreUserId.includes(userId);
      });

      ignoreUserId.push(...filterMentionedPostUserId);

      const filterRootMentionedUserIds = rootMentionedUserIds.filter((userId) => {
        return !ignoreUserId.includes(userId);
      });

      ignoreUserId.push(...filterRootMentionedUserIds);

      const filterRootCommentedUserIds = rootCommentedUserIds.filter((userId) => {
        return !ignoreUserId.includes(userId);
      });

      return {
        postOwnerId: postOwner,
        mentionedPostUserId: [...new Set(filterMentionedPostUserId)],
        rootCommentedUserIds: [...new Set(filterRootCommentedUserIds)],
        rootMentionedUserIds: [...new Set(filterRootMentionedUserIds)],
        currentMentionedUserIds: [...new Set(filterCurrentMentionedUserIds)],
      };
    } catch (e) {
      this._logger.error(e, e.stack);
      return {
        postOwnerId: null,
        mentionedPostUserId: [],
        rootCommentedUserIds: [],
        rootMentionedUserIds: [],
        currentMentionedUserIds: [],
      };
    }
  }

  public async findComment(commentId: number): Promise<CommentResponseDto> {
    const response = await this._commentModel.findOne({
      where: {
        id: commentId,
      },
      include: [
        {
          model: MediaModel,
          through: {
            attributes: [],
          },
          required: false,
        },
        {
          model: MentionModel,
          as: 'mentions',
          required: false,
        },
        {
          association: 'parent',
          as: 'parentComment',
          required: false,
          include: [
            {
              model: MediaModel,
              through: {
                attributes: [],
              },
              required: false,
            },
            {
              model: MentionModel,
              as: 'mentions',
              required: false,
            },
          ],
        },
      ],
    });

    if (!response) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_COMMENT_EXISTING);
    }

    const rawComment = response.toJSON();

    await this._mentionService.bindMentionsToComment([rawComment]);

    await this.bindUserToComment([rawComment]);

    return this._classTransformer.plainToInstance(CommentResponseDto, rawComment, {
      excludeExtraneousValues: true,
    });
  }
}
