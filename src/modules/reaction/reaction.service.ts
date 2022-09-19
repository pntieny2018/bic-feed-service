import { UserDto } from '../auth';
import { PostAllow } from '../post';
import { CommentService } from '../comment';
import { ReactionEnum } from './reaction.enum';
import { UserService } from '../../shared/user';
import { Sequelize } from 'sequelize-typescript';
import { plainToInstance } from 'class-transformer';
import { PostService } from '../post/post.service';
import {
  CommentReactionModel,
  ICommentReaction,
} from '../../database/models/comment-reaction.model';
import { LogicException } from '../../common/exceptions';
import { getDatabaseConfig } from '../../config/database';
import sequelize, { Op, QueryTypes, Transaction } from 'sequelize';
import { PostPolicyService } from '../post/post-policy.service';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
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
import { NIL as NIL_UUID } from 'uuid';
import { SentryService } from '@app/sentry';
import { OrderEnum } from '../../common/dto';
import { FeedService } from '../feed/feed.service';
import {
  SERIALIZE_TRANSACTION_ERROR,
  SERIALIZE_TRANSACTION_MAX_ATTEMPT,
  UNIQUE_CONSTRAINT_ERROR,
} from './reaction.constant';

@Injectable()
export class ReactionService {
  private _logger = new Logger(ReactionService.name);

  public constructor(
    @Inject(forwardRef(() => PostService))
    private readonly _postService: PostService,
    private readonly _userService: UserService,
    @Inject(forwardRef(() => CommentService))
    private readonly _commentService: CommentService,
    private readonly _followService: FollowService,
    private readonly _postPolicyService: PostPolicyService,
    private readonly _notificationService: NotificationService,
    @InjectConnection() private readonly _sequelize: Sequelize,
    @InjectModel(PostReactionModel)
    private readonly _postReactionModel: typeof PostReactionModel,
    @InjectModel(CommentReactionModel)
    private readonly _commentReactionModel: typeof CommentReactionModel,
    private readonly _reactionNotificationService: ReactionActivityService,
    private readonly _sentryService: SentryService,
    @Inject(forwardRef(() => FeedService))
    private readonly _feedService: FeedService
  ) {}

  /**
   * Reaction statistics
   * @param getReactionDto GetReactionDto
   * @returns Promise resolve ReactionsResponseDto
   */
  public async gets(getReactionDto: GetReactionDto): Promise<ReactionsResponseDto> {
    const { schema } = getDatabaseConfig();
    const response = new ReactionsResponseDto();
    const { target, targetId, latestId, limit, order, reactionName } = getReactionDto;

    const conditions = {};
    const symbol = order === OrderEnum.DESC ? Op.lte : Op.gte;

    if (latestId !== NIL_UUID) {
      conditions['id'] = {
        [Op.not]: latestId,
      };
    }

    switch (target) {
      case ReactionEnum.POST:
        if (latestId !== NIL_UUID) {
          conditions['createdAt'] = {
            [symbol]: sequelize.literal(
              `(SELECT pr.created_at FROM ${schema}.posts_reactions AS pr WHERE id=${this._sequelize.escape(
                latestId
              )})`
            ),
          };
        }
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
          list: await this._bindActor(reactionsPost),
          limit: limit,
          latestId: reactionsPost.length > 0 ? reactionsPost[reactionsPost.length - 1]?.id : null,
        };
      case ReactionEnum.COMMENT:
        if (latestId !== NIL_UUID) {
          conditions['createdAt'] = {
            [symbol]: sequelize.literal(
              `(SELECT cr.created_at FROM ${schema}.comments_reactions AS cr WHERE id=${this._sequelize.escape(
                latestId
              )})`
            ),
          };
        }
        const rsc = await this._commentReactionModel.findAll({
          where: {
            reactionName: reactionName,
            commentId: targetId,
            ...conditions,
          },
          limit: limit,
          order: [['createdAt', 'DESC']],
        });

        const reactionsComment = (rsc ?? []).map((r) => r.toJSON());

        return {
          list: await this._bindActor(reactionsComment),
          limit: limit,
          latestId:
            reactionsComment.length > 0 ? reactionsComment[reactionsComment.length - 1]?.id : null,
        };
    }

    return response;
  }

  private async _bindActor(
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
  public create(
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
   * @param attempt Number
   * @returns Promise resolve ReactionResponseDto
   * @throws HttpException
   */
  private async _createPostReaction(
    userDto: UserDto,
    createReactionDto: CreateReactionDto,
    attempt = 0
  ): Promise<ReactionResponseDto> {
    if (attempt === SERIALIZE_TRANSACTION_MAX_ATTEMPT) {
      throw new LogicException(HTTP_STATUS_ID.API_SERVER_INTERNAL_ERROR);
    }

    this._logger.debug(`[_createPostReaction]: ${JSON.stringify(createReactionDto)}`);

    const { id: userId } = userDto;
    const { reactionName, targetId: postId } = createReactionDto;
    try {
      const post = await this._postService.get(postId, userDto, {
        commentLimit: 0,
        childCommentLimit: 0,
      });

      await this._postPolicyService.allow(post, PostAllow.REACT);

      const { schema } = getDatabaseConfig();
      const rc = await this._sequelize.transaction(
        {
          isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
        },
        (t) => {
          return this._sequelize.query(`CALL ${schema}.create_post_reaction(?,?,?,null)`, {
            replacements: [postId, userId, reactionName],
            transaction: t,
            type: QueryTypes.SELECT,
          });
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
          .catch((ex) => {
            this._logger.error(ex, ex.stack);
            this._sentryService.captureException(ex);
          });
        this._feedService.markSeenPosts(postId, userId).catch((ex) => {
          this._logger.error(ex, ex.stack);
          this._sentryService.captureException(ex);
        });
        return reaction;
      }
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.API_SERVER_INTERNAL_ERROR);
    } catch (e) {
      this._logger.error(e, e?.stack);
      if (e['name'] === UNIQUE_CONSTRAINT_ERROR) {
        this._sentryService.captureException(e);
        throw new LogicException(HTTP_STATUS_ID.APP_REACTION_UNIQUE);
      }
      if (e.message === HTTP_STATUS_ID.APP_REACTION_RATE_LIMIT_KIND) {
        this._sentryService.captureException(e);
        throw new LogicException(e.message);
      }
      if (e.message === SERIALIZE_TRANSACTION_ERROR) {
        this._sentryService.captureException(e);
        return this._createPostReaction(userDto, createReactionDto, attempt + 1);
      }

      throw e;
    }
  }

  /**
   * Create comment reaction
   * @param userDto UserDto
   * @param createReactionDto CreateReactionDto
   * @param attempt
   * @returns Promise resolve ReactionResponseDto
   * @throws HttpException
   */
  private async _createCommentReaction(
    userDto: UserDto,
    createReactionDto: CreateReactionDto,
    attempt = 0
  ): Promise<ReactionResponseDto> {
    if (attempt === SERIALIZE_TRANSACTION_MAX_ATTEMPT) {
      throw new LogicException(HTTP_STATUS_ID.API_SERVER_INTERNAL_ERROR);
    }

    const { id: userId } = userDto;

    const { reactionName, targetId: commentId } = createReactionDto;

    const comment = await this._commentService.findComment(commentId);

    if (!comment) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_COMMENT_NOT_EXISTING);
    }

    const post = await this._postService.get(comment.postId, userDto, {
      commentLimit: 0,
      childCommentLimit: 0,
    });

    if (!post) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_POST_NOT_EXISTING);
    }

    await this._postPolicyService.allow(post, PostAllow.REACT);

    const { schema } = getDatabaseConfig();
    try {
      const rc = await this._sequelize.transaction(
        {
          isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
        },
        (t) => {
          return this._sequelize.query(`CALL ${schema}.create_comment_reaction(?,?,?,null)`, {
            replacements: [commentId, userId, reactionName],
            transaction: t,
            type: QueryTypes.SELECT,
          });
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

        const type =
          comment.parentId !== NIL_UUID ? TypeActivity.CHILD_COMMENT : TypeActivity.COMMENT;

        const ownerId = comment.parentId !== NIL_UUID ? comment.parent.actor.id : comment.actor.id;

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
          .catch((ex) => {
            this._logger.error(ex, ex.stack);
            this._sentryService.captureException(ex);
          });

        return reaction;
      }
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.API_SERVER_INTERNAL_ERROR);
    } catch (e) {
      this._logger.error(e, e?.stack);
      if (e['name'] === UNIQUE_CONSTRAINT_ERROR) {
        this._sentryService.captureException(e);
        throw new LogicException(HTTP_STATUS_ID.APP_REACTION_UNIQUE);
      }
      if (e.message === HTTP_STATUS_ID.APP_REACTION_RATE_LIMIT_KIND) {
        this._sentryService.captureException(e);
        throw new LogicException(e.message);
      }

      if (e.message === SERIALIZE_TRANSACTION_ERROR) {
        this._sentryService.captureException(e);
        return this._createCommentReaction(userDto, createReactionDto, attempt + 1);
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
  public async delete(
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
   * @param attempt
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  private async _deletePostReaction(
    userDto: UserDto,
    deleteReactionDto: DeleteReactionDto,
    attempt = 0
  ): Promise<IPostReaction> {
    this._logger.debug(`[_deletePostReaction]: ${JSON.stringify(deleteReactionDto)}`);

    if (attempt === SERIALIZE_TRANSACTION_MAX_ATTEMPT) {
      throw new LogicException(HTTP_STATUS_ID.API_SERVER_INTERNAL_ERROR);
    }

    const post = await this._postService.get(deleteReactionDto.targetId, userDto, {
      commentLimit: 0,
      childCommentLimit: 0,
    });

    await this._postPolicyService.allow(post, PostAllow.REACT);

    const conditions = {};

    if (deleteReactionDto.reactionName) {
      conditions['reactionName'] = deleteReactionDto.reactionName;
    } else if (deleteReactionDto.reactionId) {
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
          postId: deleteReactionDto.targetId,
        },
        transaction: trx,
      });

      if (!existedReaction) {
        ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_REACTION_NOT_EXISTING);
      }

      const response = existedReaction.toJSON();

      await this._postReactionModel.destroy({
        where: {
          id: existedReaction.id,
          postId: deleteReactionDto.targetId,
        },
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
      this._logger.error(ex, ex.message, ex.stack);

      if (ex.message === SERIALIZE_TRANSACTION_ERROR) {
        this._sentryService.captureException(ex);
        return this._deletePostReaction(userDto, deleteReactionDto, attempt + 1);
      }
      throw ex;
    }
  }

  /**
   * Delete comment reaction
   * @param userDto UserDto
   * @param deleteReactionDto DeleteReactionDto
   * @param attempt
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  private async _deleteCommentReaction(
    userDto: UserDto,
    deleteReactionDto: DeleteReactionDto,
    attempt = 0
  ): Promise<ICommentReaction> {
    this._logger.debug(`[_deleteCommentReaction]: ${JSON.stringify(deleteReactionDto)},${attempt}`);

    if (attempt === SERIALIZE_TRANSACTION_MAX_ATTEMPT) {
      throw new LogicException(HTTP_STATUS_ID.API_SERVER_INTERNAL_ERROR);
    }
    const { id: userId } = userDto;
    const { targetId } = deleteReactionDto;

    const comment = await this._commentService.findComment(targetId);

    if (!comment) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_COMMENT_NOT_EXISTING);
    }

    const post = await this._postService.get(comment.postId, userDto, {
      commentLimit: 0,
      childCommentLimit: 0,
    });

    if (!post) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_POST_NOT_EXISTING);
    }

    await this._postPolicyService.allow(post, PostAllow.REACT);

    const conditions = {};
    if (deleteReactionDto.reactionName) {
      conditions['reactionName'] = deleteReactionDto.reactionName;
    } else if (deleteReactionDto.reactionId) {
      conditions['id'] = deleteReactionDto.reactionId;
    }
    const trx = await this._sequelize.transaction({
      isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
    });
    try {
      const existedReaction = await this._commentReactionModel.findOne({
        where: {
          ...conditions,
          createdBy: userId,
          commentId: deleteReactionDto.targetId,
        },
        transaction: trx,
      });

      if (!existedReaction) {
        ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_REACTION_NOT_EXISTING);
      }

      const response = existedReaction.toJSON();

      await this._commentReactionModel.destroy({
        where: {
          id: existedReaction.id,
          commentId: deleteReactionDto.targetId,
        },
        transaction: trx,
      });

      await trx.commit();

      const type =
        comment.parentId !== NIL_UUID ? TypeActivity.CHILD_COMMENT : TypeActivity.COMMENT;

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

      if (ex.message === SERIALIZE_TRANSACTION_ERROR) {
        this._sentryService.captureException(ex);
        return this._deleteCommentReaction(userDto, deleteReactionDto, attempt + 1);
      }

      throw ex;
    }
  }

  /**
   * Delete reaction by commentIds
   * @param commentIds string[]
   * @returns Promise resolve boolean
   * @throws HttpException
   * @param commentIds
   * @param transaction Transaction
   */
  public async deleteByCommentIds(commentIds: string[], transaction: Transaction): Promise<number> {
    return this._commentReactionModel.destroy({
      where: {
        commentId: commentIds,
      },
      transaction: transaction,
    });
  }

  /**
   * Delete reaction by postIds
   * @param postIds string[]
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async deleteByPostIds(postIds: string[]): Promise<number> {
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
  public async bindToPosts(posts: any[]): Promise<void> {
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
  public async bindToComments(comments: any[]): Promise<void> {
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
      const reactionsCount = {};
      reactions
        .filter((i) => {
          return i.commentId === comment.id;
        })
        .forEach((v, i) => (reactionsCount[i] = { [v.reactionName]: parseInt(v.total) }));
      comment.reactionsCount = reactionsCount;
      //Map reaction to child comment
      if (comment.child?.list && comment.child?.list.length) {
        for (const cm of comment.child.list) {
          const childRC = {};
          reactions
            .filter((r) => {
              return r.commentId === cm.id;
            })
            .forEach((v, i) => (childRC[i] = { [v.reactionName]: parseInt(v.total) }));
          cm.reactionsCount = childRC;
        }
      }
    }
  }
}
