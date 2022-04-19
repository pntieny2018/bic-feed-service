import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { QueryTypes, Sequelize } from 'sequelize';
import { InternalEventEmitterService } from '../../../app/custom/event-emitter';
import { CommentReactionModel } from '../../../database/models/comment-reaction.model';
import { CommentModel } from '../../../database/models/comment.model';
import { PostGroupModel } from '../../../database/models/post-group.model';
import { PostReactionModel } from '../../../database/models/post-reaction.model';
import { PostModel } from '../../../database/models/post.model';
import { CreateReactionInternalEvent, DeleteReactionInternalEvent } from '../../../events/reaction';
import { UserService } from '../../../shared/user';
import { UserSharedDto } from '../../../shared/user/dto';
import { UserDto } from '../../auth';
import { ReactionDto } from '../dto/reaction.dto';
import { CreateReactionDto } from '../dto/request';

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
    private _sequelizeConnection: Sequelize
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

    const createReactionInternalEvent = new CreateReactionInternalEvent({
      userSharedDto: userSharedDto,
      reaction: reaction,
      post: post.toJSON(),
      comment: comment?.toJSON(),
    });

    this._internalEventEmitterService.emit(createReactionInternalEvent);
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

    const deleteReactionInternalEvent = new DeleteReactionInternalEvent({
      userSharedDto: userSharedDto,
      reaction: reaction,
      post: post.toJSON(),
      comment: comment?.toJSON(),
    });
    this._internalEventEmitterService.emit(deleteReactionInternalEvent);
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

  /**
   * Bind commentsCount info to post
   * @param posts Array of post
   * @returns Promise resolve void
   * @throws HttpException
   */
  public async bindReactionToPosts(posts: any[]): Promise<void> {
    const postIds = [];
    for (const post of posts) {
      postIds.push(post.id);
    }

    const query = `SELECT 
    feed.posts_reactions.post_id,
       COUNT(feed.posts_reactions.id ) as total,
       feed.posts_reactions.reaction_name as reactionName,
       MIN(feed.posts_reactions.created_at) as minDate
    FROM   feed.posts_reactions
    WHERE  feed.posts_reactions.post_id IN(:postIds)
    GROUP BY feed.posts_reactions.post_id, feed.posts_reactions.reaction_name
    ORDER BY minDate ASC`;
    const reactions: any[] = await this._sequelizeConnection.query(query, {
      replacements: {
        postIds,
      },
      type: QueryTypes.SELECT,
      raw: true,
    });
    for (const post of posts) {
      post.reactionsCount = reactions.filter((i) => {
        return i.post_id === post.id
      });
    }
  }
}
