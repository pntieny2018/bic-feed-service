import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { QueryTypes, Sequelize } from 'sequelize';
import { InternalEventEmitterService } from '../../../app/custom/event-emitter';
import {
  CommentReactionModel,
  ICommentReaction,
} from '../../../database/models/comment-reaction.model';
import { CommentModel } from '../../../database/models/comment.model';
import { PostGroupModel } from '../../../database/models/post-group.model';
import { IPostReaction, PostReactionModel } from '../../../database/models/post-reaction.model';
import { PostModel } from '../../../database/models/post.model';
import { CreateReactionInternalEvent, DeleteReactionInternalEvent } from '../../../events/reaction';
import { UserService } from '../../../shared/user';
import { UserSharedDto } from '../../../shared/user/dto';
import { UserDto } from '../../auth';
import { ReactionDto } from '../dto/reaction.dto';
import { CreateReactionDto, GetReactionDto } from '../dto/request';
import { ReactionEnum } from '../reaction.enum';
import { ReactionResponseDto, ReactionsResponseDto } from '../dto/response';
import { Op } from 'sequelize';
import { ObjectHelper } from '../../../common/helpers';
import { getDatabaseConfig } from '../../../config/database';
import { NotificationPayloadDto } from '../../../notification/dto/requests/notification-payload.dto';
import { ReactionEventPayload } from '../../../events/reaction/payload';
import { NotificationService } from '../../../notification';

@Injectable()
export class CommonReactionService {
  public constructor(
    @InjectModel(PostReactionModel) private readonly _postReactionModel: typeof PostReactionModel,
    @InjectModel(CommentReactionModel)
    private readonly _commentReactionModel: typeof CommentReactionModel,
    @InjectModel(CommentModel) private readonly _commentModel: typeof CommentModel,
    @InjectModel(PostModel) private readonly _postModel: typeof PostModel,
    private readonly _internalEventEmitterService: InternalEventEmitterService,
    private readonly _userService: UserService,
    @InjectConnection()
    private _sequelizeConnection: Sequelize,
    private readonly _notificationService: NotificationService
  ) {}

  /**
   * Is existed post reaction
   * @param userId number
   * @param createReactionDto CreateReactionDto
   * @returns Promise resolve boolean
   */
  public async isExistedPostReaction(
    userId: number,
    createReactionDto: CreateReactionDto
  ): Promise<boolean> {
    const { reactionName, targetId: postId } = createReactionDto;
    const existedReaction = await this._postReactionModel.findOne<PostReactionModel>({
      where: {
        postId: postId,
        reactionName: reactionName,
        createdBy: userId,
      },
    });
    return !!existedReaction;
  }

  /**
   * Is existed comment reaction
   * @param userId number
   * @param createReactionDto CreateReactionDto
   * @returns Promise resolve boolean
   */
  public async isExistedCommentReaction(
    userId: number,
    createReactionDto: CreateReactionDto
  ): Promise<boolean> {
    const { reactionName, targetId: commentId } = createReactionDto;
    const existedReaction = await this._commentReactionModel.findOne<CommentReactionModel>({
      where: {
        commentId: commentId,
        reactionName: reactionName,
        createdBy: userId,
      },
    });
    return !!existedReaction;
  }

  /**
   * Create create-reaction events
   * @param userSharedDto UserSharedDto
   * @param reaction ReactionDto
   * @param postId number
   * @param commentId number
   * @returns Promise resolve void
   */
  public async createCreateReactionEvent(
    userSharedDto: UserSharedDto,
    reaction: ReactionDto,
    postId: number,
    commentId?: number
  ): Promise<void> {
    const comment = !!commentId ? await this.getComment(commentId) : null;
    const post = await this.getPost(postId ?? comment?.postId);

    // const createReactionInternalEvent = new CreateReactionInternalEvent({
    //   userSharedDto: userSharedDto,
    //   reaction: reaction,
    //   post: post.toJSON(),
    //   comment: comment?.toJSON(),
    // });

    // this._internalEventEmitterService.emit(createReactionInternalEvent);
    const kafkaCreateReactionMessage: NotificationPayloadDto<ReactionEventPayload> = {
      key: comment ? `c_${comment.id}` : `p_${post.id}`,
      value: {
        actor: userSharedDto,
        event: CreateReactionInternalEvent.event,
        data: {
          reaction: reaction,
          post: post.toJSON(),
          comment: comment?.toJSON(),
        },
      },
    };

    this._notificationService.publishReactionNotification<ReactionEventPayload>(
      kafkaCreateReactionMessage
    );
  }

  /**
   * Create delete-reaction event
   * @param userDto UserDto
   * @param reaction ReactionDto
   * @param postId number
   * @param commentId number
   * @returns Promise resolve void
   */
  public async createDeleteReactionEvent(
    userDto: UserDto,
    reaction: ReactionDto,
    postId: number,
    commentId?: number
  ): Promise<void> {
    const comment = !!commentId ? await this.getComment(commentId) : null;
    const post = await this.getPost(postId ?? comment?.postId);
    const userSharedDto = await this._userService.get(userDto.id);

    // const deleteReactionInternalEvent = new DeleteReactionInternalEvent({
    //   userSharedDto: userSharedDto,
    //   reaction: reaction,
    //   post: post.toJSON(),
    //   comment: comment?.toJSON(),
    // });
    // this._internalEventEmitterService.emit(deleteReactionInternalEvent);

    const kafkaDeleteReactionMessage: NotificationPayloadDto<ReactionEventPayload> = {
      key: comment ? `c_${comment.id}` : `p_${post.id}`,
      value: {
        actor: userSharedDto,
        event: DeleteReactionInternalEvent.event,
        data: {
          reaction: reaction,
          post: post.toJSON(),
          comment: comment?.toJSON(),
        },
      },
    };
    this._notificationService.publishReactionNotification<ReactionEventPayload>(
      kafkaDeleteReactionMessage
    );
  }

  /**
   * Get post with groups and reactionsCount by id
   * @param postId number
   * @returns Promise resolve PostModel
   */
  public async getPost(postId: number): Promise<PostModel> {
    const post = await this._postModel.findOne<PostModel>({
      attributes: {
        include: [PostModel.loadReactionsCount()],
      },
      where: {
        id: postId,
      },
      include: [
        {
          model: PostGroupModel,
          required: true,
        },
      ],
    });
    return post;
  }

  /**
   * Get comment with reactionsCount
   * @param commentId number
   * @returns Promise resolve CommentModel
   */
  public async getComment(commentId: number): Promise<CommentModel> {
    const comment = await this._commentModel.findOne<CommentModel>({
      attributes: {
        include: [CommentModel.loadReactionsCount()],
      },
      where: {
        id: commentId,
      },
    });
    return comment;
  }

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
        createdBy: r.createdBy,
      })
    );
  }

  /**
   * Bind reaction to post
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
    const reactions: any[] = await this._sequelizeConnection.query(query, {
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
   * @param posts Array of post
   * @returns Promise resolve void
   * @throws HttpException
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
    const reactions: any[] = await this._sequelizeConnection.query(query, {
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
