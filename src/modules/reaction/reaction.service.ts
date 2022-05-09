import { UserDto } from '../auth';
import { PostAllow } from '../post';
import { CommentService } from '../comment';
import { ReactionEnum } from './reaction.enum';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../shared/user';
import { Sequelize } from 'sequelize-typescript';
import { GroupService } from '../../shared/group';
import { plainToInstance } from 'class-transformer';
import { PostService } from '../post/post.service';
import {
  CommentReactionModel,
  ICommentReaction,
} from '../../database/models/comment-reaction.model';
import { LogicException } from '../../common/exceptions';
import { getDatabaseConfig } from '../../config/database';
import { LOCK, Op, QueryTypes, Transaction } from 'sequelize';
import { PostPolicyService } from '../post/post-policy.service';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { ReactionCountService } from '../../shared/reaction-count';
import { ExceptionHelper, ObjectHelper } from '../../common/helpers';
import { NotificationService, TypeActivity } from '../../notification';
import { ReactionActivityService } from '../../notification/activities';
import { ReactionResponseDto, ReactionsResponseDto } from './dto/response';
import {
  HTTP_STATUS_ID,
  ReactionHasBeenCreated,
  ReactionHasBeenRemoved,
} from '../../common/constants';
import { CreateReactionDto, DeleteReactionDto, GetReactionDto } from './dto/request';
import { forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { IPostReaction, PostReactionModel } from '../../database/models/post-reaction.model';
import { FollowService } from '../follow';

const UNIQUE_CONSTRAINT_ERROR = 'SequelizeUniqueConstraintError';

@Injectable()
export class ReactionService {
  private _logger = new Logger(ReactionService.name);

  public constructor(
    @Inject(forwardRef(() => PostService))
    private readonly _postService: PostService,
    private readonly _userService: UserService,
    private readonly _groupService: GroupService,
    private readonly _configService: ConfigService,
    @Inject(forwardRef(() => CommentService))
    private readonly _commentService: CommentService,
    private readonly _followService: FollowService,
    private readonly _postPolicyService: PostPolicyService,
    private readonly _notificationService: NotificationService,
    @InjectConnection() private readonly _sequelize: Sequelize,
    private readonly _reactionCountService: ReactionCountService,
    @InjectModel(PostReactionModel)
    private readonly _postReactionModel: typeof PostReactionModel,
    @InjectModel(CommentReactionModel)
    private readonly _commentReactionModel: typeof CommentReactionModel,
    private readonly _reactionNotificationService: ReactionActivityService
  ) {}

  /**
   * Reaction statistics
   * @param getReactionDto GetReactionDto
   * @returns Promise resolve ReactionsResponseDto
   */
  public async getReactions(getReactionDto: GetReactionDto): Promise<ReactionsResponseDto> {
    const response = new ReactionsResponseDto();
    const { target, targetId, latestId, limit, order, reactionName } = getReactionDto;
    const conditions =
      latestId === 0
        ? {}
        : {
            id: {
              [Op.lt]: latestId,
            },
          };

    switch (target) {
      case ReactionEnum.POST:
        const rsp = await this._postReactionModel.findAll({
          where: {
            reactionName: reactionName,
            postId: targetId,
            ...conditions,
          },
          limit: limit,
          order: [['createdAt', order]],
        });
        const reactionsPost = (rsp ?? []).map((r) => r.toJSON());
        return {
          order: order,
          list: await this._bindActorToReaction(reactionsPost),
          limit: limit,
          latestId: reactionsPost.length > 0 ? reactionsPost[reactionsPost.length - 1]?.id : 0,
        };
      case ReactionEnum.COMMENT:
        const rsc = await this._commentReactionModel.findAll({
          where: {
            reactionName: reactionName,
            commentId: targetId,
            ...conditions,
          },
          limit: limit,
          order: [['createdAt', order]],
        });

        const reactionsComment = (rsc ?? []).map((r) => r.toJSON());
        return {
          order: order,
          list: await this._bindActorToReaction(reactionsComment),
          limit: limit,
          latestId:
            reactionsComment.length > 0 ? reactionsComment[reactionsComment.length - 1]?.id : 0,
        };
    }

    return response;
  }

  private async _bindActorToReaction(
    reactions: IPostReaction[] | ICommentReaction[]
  ): Promise<ReactionResponseDto[]> {
    const actorIds = reactions.map((r) => r.createdBy);
    const actors = await this._userService.getMany(actorIds);
    return reactions.map(
      (r): ReactionResponseDto => ({
        id: r.id,
        actor: ObjectHelper.omit(
          ['groups'],
          actors.find((a) => a.id == r.createdBy)
        ) as any,
        reactionName: r.reactionName,
        createdAt: r.createdAt,
      })
    );
  }

  /**
   * Create reaction
   * @param userDto UserDto
   * @param createReactionDto CreateReactionDto
   * @returns Promise resolve ReactionResponseDto
   */
  public createReaction(
    userDto: UserDto,
    createReactionDto: CreateReactionDto
  ): Promise<ReactionResponseDto> {
    switch (createReactionDto.target) {
      case ReactionEnum.POST:
        return this._createPostReaction(userDto, createReactionDto);
      case ReactionEnum.COMMENT:
        return this._createCommentReaction(userDto, createReactionDto);
      case ReactionEnum.ARTICLE:
        break;
      default:
        throw new LogicException(HTTP_STATUS_ID.APP_REACTION_TARGET_EXISTING);
    }
  }

  /**
   * Create post reaction
   * @param userDto UserDto
   * @param createReactionDto CreateReactionDto
   * @returns Promise resolve ReactionResponseDto
   * @throws HttpException
   */
  private async _createPostReaction(
    userDto: UserDto,
    createReactionDto: CreateReactionDto
  ): Promise<ReactionResponseDto> {
    this._logger.debug(`[_createPostReaction]: ${JSON.stringify(createReactionDto)}`);

    const { id: userId } = userDto;
    const { reactionName, targetId: postId } = createReactionDto;
    try {
      const post = await this._postService.getPost(postId, userDto, {
        commentLimit: 0,
        childCommentLimit: 0,
      });

      this._postPolicyService.allow(post, PostAllow.REACT);

      const { schema } = getDatabaseConfig();
      const rc = await this._sequelize.transaction(
        {
          isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
        },
        (t) => {
          return this._sequelize.query(
            `CALL ${schema}.create_post_reaction($postId,$userId,$reactionName,null)`,
            {
              bind: {
                postId: postId,
                userId: userId,
                reactionName: reactionName,
              },
              transaction: t,
              type: QueryTypes.SELECT,
            }
          );
        }
      );
      if (rc !== null && rc.length > 0 && rc[0]['cpr_id']) {
        const postReaction = await this._postReactionModel.findByPk(rc[0]['cpr_id']);

        const reaction = plainToInstance(ReactionResponseDto, {
          id: postReaction.id,
          reactionName: postReaction.reactionName,
          createdAt: postReaction.createdAt,
          actor: {
            ...ObjectHelper.omit(['groups'], userDto.profile),
            email: userDto.email,
          },
        });

        this._followService
          .getValidUserIds(
            [post.actor.id],
            post.audience.groups.map((g) => g.id)
          )
          .then((userIds) => {
            if (!userIds.length) {
              return;
            }
            const activity = this._reactionNotificationService.createPayload(
              TypeActivity.POST,
              {
                reaction: reaction,
                post: post,
              },
              'create'
            );

            this._notificationService.publishReactionNotification({
              key: `${post.id}`,
              value: {
                actor: {
                  id: userDto.profile.id,
                  fullname: userDto.profile.fullname,
                  username: userDto.profile.username,
                  avatar: userDto.profile.avatar,
                },
                event: ReactionHasBeenCreated,
                data: activity,
              },
            });
          })
          .catch((ex) => this._logger.error(ex, ex.stack));

        return reaction;
      }
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.API_SERVER_INTERNAL_ERROR);
    } catch (e) {
      this._logger.error(e, e?.stack);
      if (e['name'] === UNIQUE_CONSTRAINT_ERROR) {
        throw new LogicException(HTTP_STATUS_ID.APP_REACTION_UNIQUE);
      }
      if (e.message === HTTP_STATUS_ID.APP_REACTION_RATE_LIMIT_KIND) {
        throw new LogicException(e.message);
      }

      throw e;
    }
  }

  /**
   * Create comment reaction
   * @param userDto UserDto
   * @param createReactionDto CreateReactionDto
   * @returns Promise resolve ReactionResponseDto
   * @throws HttpException
   */
  private async _createCommentReaction(
    userDto: UserDto,
    createReactionDto: CreateReactionDto
  ): Promise<ReactionResponseDto> {
    const { id: userId } = userDto;

    const { reactionName, targetId: commentId } = createReactionDto;

    const comment = await this._commentService.findComment(commentId);

    if (!comment) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_COMMENT_EXISTING);
    }

    const post = await this._postService.getPost(comment.postId, userDto, {
      commentLimit: 0,
      childCommentLimit: 0,
    });

    if (!post) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_POST_EXISTING);
    }

    this._postPolicyService.allow(post, PostAllow.REACT);

    const { schema } = getDatabaseConfig();
    try {
      const rc = await this._sequelize.transaction(
        {
          isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
        },
        (t) => {
          return this._sequelize.query(
            `CALL ${schema}.create_comment_reaction($commentId,$userId,$reactionName,null)`,
            {
              bind: {
                commentId: commentId,
                userId: userId,
                reactionName: reactionName,
              },
              transaction: t,
              type: QueryTypes.SELECT,
            }
          );
        }
      );
      if (rc !== null && rc.length > 0 && rc[0]['ccr_id']) {
        const commentReaction = await this._commentReactionModel.findByPk(rc[0]['ccr_id']);

        const reaction = plainToInstance(ReactionResponseDto, {
          id: commentReaction.id,
          reactionName: commentReaction.reactionName,
          createdAt: commentReaction.createdAt,
          actor: {
            ...ObjectHelper.omit(['groups'], userDto.profile),
            email: userDto.email,
          },
        });

        const type = comment.parentId ? TypeActivity.CHILD_COMMENT : TypeActivity.COMMENT;

        const ownerId = comment.parentId ? comment.parent.actor.id : comment.actor.id;

        this._followService
          .getValidUserIds(
            [ownerId],
            post.audience.groups.map((g) => g.id)
          )
          .then((userIds) => {
            if (!userIds.length) {
              return;
            }
            const activity = this._reactionNotificationService.createPayload(
              type,
              {
                reaction: reaction,
                post: post,
                comment,
              },
              'create'
            );

            this._notificationService.publishReactionNotification({
              key: `${post.id}`,
              value: {
                actor: {
                  id: userDto.profile.id,
                  fullname: userDto.profile.fullname,
                  username: userDto.profile.username,
                  avatar: userDto.profile.avatar,
                },
                event: ReactionHasBeenCreated,
                data: activity,
              },
            });
          })
          .catch((ex) => this._logger.error(ex, ex.stack));

        return reaction;
      }
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.API_SERVER_INTERNAL_ERROR);
    } catch (e) {
      this._logger.error(e, e?.stack);
      if (e['name'] === UNIQUE_CONSTRAINT_ERROR) {
        throw new LogicException(HTTP_STATUS_ID.APP_REACTION_UNIQUE);
      }
      if (e.message === HTTP_STATUS_ID.APP_REACTION_RATE_LIMIT_KIND) {
        throw new LogicException(e.message);
      }
      throw e;
    }
  }

  /**
   * Delete reaction
   * @param userDto UserDto
   * @param deleteReactionDto DeleteReactionDto
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async deleteReaction(
    userDto: UserDto,
    deleteReactionDto: DeleteReactionDto
  ): Promise<IPostReaction | ICommentReaction> {
    switch (deleteReactionDto.target) {
      case ReactionEnum.POST:
        return this._deletePostReaction(userDto, deleteReactionDto);
      case ReactionEnum.COMMENT:
        return this._deleteCommentReaction(userDto, deleteReactionDto);
      default:
        throw new NotFoundException('Reaction type not match.');
    }
  }

  /**
   * Delete post reaction
   * @param userDto UserDto
   * @param deleteReactionDto DeleteReactionDto
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  private async _deletePostReaction(
    userDto: UserDto,
    deleteReactionDto: DeleteReactionDto
  ): Promise<IPostReaction> {
    this._logger.debug(`[_deletePostReaction]: ${JSON.stringify(deleteReactionDto)}`);

    const post = await this._postService.getPost(deleteReactionDto.targetId, userDto, {
      commentLimit: 0,
      childCommentLimit: 0,
    });

    this._postPolicyService.allow(post, PostAllow.REACT);

    const conditions = {};

    if (deleteReactionDto.reactionName) {
      conditions['reactionName'] = deleteReactionDto.reactionName;
    }

    if (deleteReactionDto.reactionId) {
      conditions['id'] = deleteReactionDto.reactionId;
    }

    const trx = await this._sequelize.transaction({
      isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
    });
    try {
      const existedReaction = await this._postReactionModel.findOne({
        where: {
          ...conditions,
          createdBy: userDto.id,
        },
        transaction: trx,
      });

      if (!existedReaction) {
        ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_REACTION_EXISTING);
      }
      const response = existedReaction.toJSON();

      await existedReaction.destroy({
        transaction: trx,
      });
      await trx.commit();

      const actor = {
        id: userDto.profile.id,
        fullname: userDto.profile.fullname,
        username: userDto.profile.username,
        avatar: userDto.profile.avatar,
      };

      const activity = this._reactionNotificationService.createPayload(
        TypeActivity.POST,
        {
          reaction: new ReactionResponseDto(
            response.id,
            response.reactionName,
            actor,
            response.createdAt
          ),
          post: post,
        },
        'create'
      );

      this._notificationService.publishReactionNotification({
        key: `${post.id}`,
        value: {
          actor: actor,
          event: ReactionHasBeenRemoved,
          data: activity,
        },
      });

      return response;
    } catch (ex) {
      await trx.rollback();
      this._logger.error(ex, ex.message, ex.stack);

      throw ex;
    }
  }

  /**
   * Delete comment reaction
   * @param userDto UserDto
   * @param deleteReactionDto DeleteReactionDto
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  private async _deleteCommentReaction(
    userDto: UserDto,
    deleteReactionDto: DeleteReactionDto
  ): Promise<ICommentReaction> {
    const { id: userId } = userDto;
    const { reactionId, targetId } = deleteReactionDto;

    const comment = await this._commentService.findComment(targetId);

    if (!comment) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_COMMENT_EXISTING);
    }

    const post = await this._postService.getPost(comment.postId, userDto, {
      commentLimit: 0,
      childCommentLimit: 0,
    });

    if (!post) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_POST_EXISTING);
    }

    this._postPolicyService.allow(post, PostAllow.REACT);

    const conditions = {};
    if (deleteReactionDto.reactionName) {
      conditions['reactionName'] = deleteReactionDto.reactionName;
    }
    if (deleteReactionDto.reactionId) {
      conditions['id'] = deleteReactionDto.reactionId;
    }
    const trx = await this._sequelize.transaction({
      isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
    });
    try {
      const existedReaction = await this._commentReactionModel.findOne({
        where: {
          id: reactionId,
          createdBy: userId,
        },
        transaction: trx,
        lock: LOCK.SHARE,
      });

      if (!existedReaction) {
        ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_REACTION_EXISTING);
      }

      const response = existedReaction.toJSON();

      await existedReaction.destroy({
        transaction: trx,
      });

      await trx.commit();

      const type = comment.parentId ? TypeActivity.CHILD_COMMENT : TypeActivity.COMMENT;

      const actor = {
        id: userId,
        fullname: userDto.profile.fullname,
        username: userDto.profile.username,
        avatar: userDto.profile.avatar,
      };
      const activity = this._reactionNotificationService.createPayload(
        type,
        {
          reaction: new ReactionResponseDto(
            response.id,
            response.reactionName,
            actor,
            response.createdAt
          ),
          post: post,
          comment,
        },
        'remove'
      );

      this._notificationService.publishReactionNotification({
        key: `${post.id}`,
        value: {
          actor: actor,
          event: ReactionHasBeenRemoved,
          data: activity,
        },
      });

      return response;
    } catch (ex) {
      await trx.rollback();
      this._logger.error(ex, ex.stack);

      throw ex;
    }
  }

  /**
   * Delete reaction by commentIds
   * @param commentIds number[]
   * @returns Promise resolve boolean
   * @throws HttpException
   * @param commentIds
   * @param transaction Transaction
   */
  public async deleteReactionByCommentIds(
    commentIds: number[],
    transaction: Transaction
  ): Promise<number> {
    return this._commentReactionModel.destroy({
      where: {
        commentId: commentIds,
      },
      transaction: transaction,
    });
  }

  /**
   * Delete reaction by postIds
   * @param postIds number[]
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async deleteReactionByPostIds(postIds: number[]): Promise<number> {
    return this._postReactionModel.destroy({
      where: {
        postId: postIds,
      },
    });
  }

  /**
   * Bind commentsCount info to post
   * @param posts Array of post
   * @returns Promise resolve void
   * @throws HttpException
   */
  public async bindReactionToPosts(posts: any[]): Promise<void> {
    const { schema } = getDatabaseConfig();
    const postIds = [];
    for (const post of posts) {
      postIds.push(post.id);
    }
    if (postIds.length === 0) return;
    const postReactionTable = PostReactionModel.tableName;

    const query = `SELECT 
      ${schema}.${postReactionTable}.post_id as "postId",
         COUNT(${schema}.${postReactionTable}.id ) as total,
         ${schema}.${postReactionTable}.reaction_name as "reactionName",
         MIN(${schema}.${postReactionTable}.created_at) as "date"
      FROM   ${schema}.${postReactionTable}
      WHERE  ${schema}.${postReactionTable}.post_id IN(:postIds)
      GROUP BY ${schema}.${postReactionTable}.post_id, ${schema}.${postReactionTable}.reaction_name
      ORDER BY date ASC`;

    const reactions: any[] = await this._sequelize.query(query, {
      replacements: {
        postIds,
      },
      type: QueryTypes.SELECT,
      raw: true,
    });
    for (const post of posts) {
      post.reactionsCount = reactions.filter((i) => {
        return i.postId === post.id;
      });
    }
  }

  /**
   * Bind reaction to comments
   * @returns Promise resolve void
   * @throws HttpException
   * @param comments
   */
  public async bindReactionToComments(comments: any[]): Promise<void> {
    const { schema } = getDatabaseConfig();
    const commentIds = [];
    for (const comment of comments) {
      commentIds.push(comment.id);
      //push child commentID
      if (comment.child?.list && comment.child?.list.length) {
        for (const cm of comment.child.list) {
          commentIds.push(cm.id);
        }
      }
    }

    if (commentIds.length === 0) return;
    const commentReactionTable = CommentReactionModel.tableName;
    const query = `SELECT 
        ${schema}.${commentReactionTable}.comment_id as "commentId",
         COUNT(${schema}.${commentReactionTable}.id ) as total,
         ${schema}.${commentReactionTable}.reaction_name as "reactionName",
         MIN(${schema}.${commentReactionTable}.created_at) as "date"
      FROM   ${schema}.${commentReactionTable}
      WHERE  ${schema}.${commentReactionTable}.comment_id IN(:commentIds)
      GROUP BY ${schema}.${commentReactionTable}.comment_id, ${schema}.${commentReactionTable}.reaction_name
      ORDER BY date ASC`;
    const reactions: any[] = await this._sequelize.query(query, {
      replacements: {
        commentIds,
      },
      type: QueryTypes.SELECT,
      raw: true,
    });
    for (const comment of comments) {
      comment.reactionsCount = reactions.filter((i) => {
        return i.commentId === comment.id;
      });
      //Map reaction to child comment
      if (comment.child?.list && comment.child?.list.length) {
        for (const cm of comment.child.list) {
          cm.reactionsCount = reactions.filter((r) => {
            return r.commentId === cm.id;
          });
        }
      }
    }
  }
}
