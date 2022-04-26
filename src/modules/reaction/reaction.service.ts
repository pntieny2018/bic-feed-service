import {
  ActionReaction,
  CreateReactionDto,
  DeleteReactionDto,
  GetReactionDto,
} from './dto/request';
import { UserDto } from '../auth';
import { PostAllow } from '../post';
import { CommentService } from '../comment';
import { ReactionEnum } from './reaction.enum';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../shared/user';
import { findOrRegisterQueue } from '../../jobs';
import { GroupService } from '../../shared/group';
import { IRedisConfig } from '../../config/redis';
import { Sequelize } from 'sequelize-typescript';
import { plainToInstance } from 'class-transformer';
import { PostService } from '../post/post.service';
import { Op, QueryTypes, Transaction } from 'sequelize';
import {
  CommentReactionModel,
  ICommentReaction,
} from '../../database/models/comment-reaction.model';
import { HTTP_STATUS_ID } from '../../common/constants';
import { LogicException } from '../../common/exceptions';
import { REACTION_KIND_LIMIT } from './reaction.constant';
import { getDatabaseConfig } from '../../config/database';
import { PostPolicyService } from '../post/post-policy.service';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { ExceptionHelper, ObjectHelper } from '../../common/helpers';
import { ReactionResponseDto, ReactionsResponseDto } from './dto/response';
import { forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { IPostReaction, PostReactionModel } from '../../database/models/post-reaction.model';
import { ReactionActivityService } from '../../notification/activities/reaction-activity.service';
import { TypeActivity } from '../../notification';

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
    private readonly _postPolicyService: PostPolicyService,
    @InjectConnection() private readonly _sequelize: Sequelize,
    @InjectModel(PostReactionModel)
    private readonly _postReactionModel: typeof PostReactionModel,
    @InjectModel(CommentReactionModel)
    private readonly _commentReactionModel: typeof CommentReactionModel,
    private readonly _reactionNotificationService: ReactionActivityService
  ) {}

  public async getReactions(getReactionDto: GetReactionDto): Promise<ReactionsResponseDto> {
    const response = new ReactionsResponseDto();
    const { target, targetId, latestId, limit, order, reactionName } = getReactionDto;
    switch (target) {
      case ReactionEnum.POST:
        const rsp = await this._postReactionModel.findAll({
          where: {
            reactionName: reactionName,
            postId: targetId,
            id: {
              [Op.gt]: latestId,
            },
          },
          limit: limit,
          order: [['createdAt', order]],
        });
        const reactionsPost = (rsp ?? []).map((r) => r.toJSON());
        return {
          list: await this._bindActorToReaction(reactionsPost),
          limit: limit,
          latestId: reactionsPost.length > 0 ? reactionsPost[reactionsPost.length - 1]?.id : 0,
        };
      case ReactionEnum.COMMENT:
        const rsc = await this._commentReactionModel.findAll({
          where: {
            reactionName: reactionName,
            commentId: targetId,
            id: {
              [Op.gt]: latestId,
            },
          },
          limit: limit,
          order: [['createdAt', order]],
        });

        const reactionsComment = (rsc ?? []).map((r) => r.toJSON());
        return {
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

  public async addToQueueReaction(
    userDto: UserDto,
    payload: CreateReactionDto | DeleteReactionDto
  ): Promise<void> {
    const queueName = `reaction:${payload.target.toString().toLowerCase()}:${payload.targetId}`;

    const redisConfig = this._configService.get<IRedisConfig>('redis');

    const queue = findOrRegisterQueue(queueName, redisConfig);

    const action =
      payload instanceof CreateReactionDto ? ActionReaction.ADD : ActionReaction.REMOVE;

    const jobName = `reaction:${action}:${new Date().toISOString()}`;
    queue
      .add(
        jobName,
        {
          userDto,
          payload: payload,
          action: action,
        },
        {
          removeOnComplete: true,
          removeOnFail: false,
        }
      )
      .catch((ex) => this._logger.error(ex, ex.stack));
  }

  /**
   * Create reaction
   * @param userDto UserDto
   * @param createReactionDto CreateReactionDto
   * @returns Promise resolve boolean
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
        throw new NotFoundException('Reaction type not match.');
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

      await this._willExceedReactionKindLimit(PostReactionModel.tableName, postId);

      const postReaction = await this._postReactionModel.create({
        postId: postId,
        reactionName: reactionName,
        createdBy: userId,
      });

      const reaction = plainToInstance(ReactionResponseDto, {
        ...ObjectHelper.omit(['createdBy'], postReaction),
        actor: {
          ...ObjectHelper.omit(['groups'], userDto.profile),
          email: userDto.email,
        },
      });

      const activity = this._reactionNotificationService.createPayload(TypeActivity.POST, {
        reaction: reaction,
        post: post,
      });
      this._logger.debug(JSON.stringify(activity));
      return reaction;
    } catch (e) {
      this._logger.error(e, e?.stack);
      if (e['name'] === UNIQUE_CONSTRAINT_ERROR) {
        throw new LogicException(HTTP_STATUS_ID.APP_REACTION_UNIQUE);
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
    try {
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

      await this._willExceedReactionKindLimit(CommentReactionModel.tableName, commentId);

      const commentReaction = await this._commentReactionModel.create({
        commentId: commentId,
        reactionName: reactionName,
        createdBy: userId,
      });
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

      const activity = this._reactionNotificationService.createPayload(type, {
        reaction: reaction,
        post: post,
        comment,
      });
      this._logger.debug(JSON.stringify(activity, null, 4));
      return reaction;
    } catch (e) {
      this._logger.error(e, e?.stack);
      if (e['name'] === UNIQUE_CONSTRAINT_ERROR) {
        throw new LogicException(HTTP_STATUS_ID.APP_REACTION_UNIQUE);
      }
      throw e;
    }
  }

  private async _willExceedReactionKindLimit(tableName: string, entityId: number): Promise<void> {
    const { schema } = getDatabaseConfig();
    const table = `${schema}.${tableName}`;
    const field = tableName === PostReactionModel.tableName ? 'post_id' : 'comment_id';
    const raws = await this._sequelize.query(`
               SELECT CASE 
               WHEN COUNT(*) = ${REACTION_KIND_LIMIT} 
               THEN 1 ELSE 0 END 
               FROM ( 
               SELECT  
                     ${table}.reaction_name
                     FROM ${table}
                     WHERE  ${table}.${field} = ${entityId}
                     GROUP BY  ${table}.reaction_name
                ) as flag
    `);
    if (raws[0][0]['flag']) {
      throw new LogicException(HTTP_STATUS_ID.APP_REACTION_RATE_LIMIT_KIND);
    }
  }

  /**
   * Delete reaction
   * @param userDto UserDto
   * @param deleteReactionDto DeleteReactionDto
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public deleteReaction(userDto: UserDto, deleteReactionDto: DeleteReactionDto): Promise<void> {
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
  ): Promise<void> {
    this._logger.debug(`[_deletePostReaction]: ${JSON.stringify(deleteReactionDto)}`);

    const conditions = {};

    if (deleteReactionDto.reactionName) {
      conditions['reactionName'] = deleteReactionDto.reactionName;
    }

    if (deleteReactionDto.reactionId) {
      conditions['id'] = deleteReactionDto.reactionId;
    }

    const existedReaction = await this._postReactionModel.findOne({
      where: {
        ...conditions,
        createdBy: userDto.id,
      },
    });

    if (!existedReaction) {
      throw new LogicException(HTTP_STATUS_ID.APP_REACTION_EXISTING);
    }

    await existedReaction.destroy();
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
  ): Promise<void> {
    const { id: userId } = userDto;
    const { reactionId } = deleteReactionDto;

    const conditions = {};
    if (deleteReactionDto.reactionName) {
      conditions['reactionName'] = deleteReactionDto.reactionName;
    }
    if (deleteReactionDto.reactionId) {
      conditions['id'] = deleteReactionDto.reactionId;
    }
    const existedReaction = await this._commentReactionModel.findOne({
      where: {
        id: reactionId,
        createdBy: userId,
      },
    });
    if (!existedReaction) {
      throw new LogicException(HTTP_STATUS_ID.APP_REACTION_EXISTING);
    }
    await existedReaction.destroy();
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
    return await this._commentReactionModel.destroy({
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
    return await this._postReactionModel.destroy({
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
}
