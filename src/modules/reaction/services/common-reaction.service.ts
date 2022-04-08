import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { InternalEventEmitterService } from '../../../app/custom/event-emitter';
import { CommentReactionModel } from '../../../database/models/comment-reaction.model';
import { IComment } from '../../../database/models/comment.model';
import { PostReactionModel } from '../../../database/models/post-reaction.model';
import { IPost } from '../../../database/models/post.model';
import { CreateReactionInternalEvent, DeleteReactionInternalEvent } from '../../../events/reaction';
import { UserService } from '../../../shared/user';
import { UserSharedDto } from '../../../shared/user/dto';
import { ReactionDto } from '../dto/reaction.dto';
import { CreateReactionDto } from '../dto/request';

@Injectable()
export class CommonReactionService {
  public constructor(
    @InjectModel(PostReactionModel) private readonly _postReactionModel: typeof PostReactionModel,
    @InjectModel(CommentReactionModel)
    private readonly _commentReactionModel: typeof CommentReactionModel,
    private readonly _internalEventEmitterService: InternalEventEmitterService,
    private readonly _userService: UserService
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
   * Create create-reaction event
   * @param userSharedDto UserSharedDto
   * @param reaction ReactionDto
   * @param post IPost
   * @param comment IComment
   * @returns void
   */
  public createCreateReactionEvent(
    userSharedDto: UserSharedDto,
    reaction: ReactionDto,
    post?: IPost,
    comment?: IComment
  ): void {
    const createReactionInternalEvent = new CreateReactionInternalEvent({
      userSharedDto: userSharedDto,
      reaction: reaction,
      post: post,
      comment: comment,
    });

    this._internalEventEmitterService.emit(createReactionInternalEvent);
  }

  /**
   * Create delete-reaction event
   * @param userId number
   * @param reaction ReactionDto
   * @returns Promise resolve void
   */
  public async createDeleteReactionEvent(userId: number, reaction: ReactionDto): Promise<void> {
    const userSharedDto = await this._userService.get(userId);
    const deleteReactionInternalEvent = new DeleteReactionInternalEvent({
      userSharedDto: userSharedDto,
      reaction: reaction,
    });
    this._internalEventEmitterService.emit(deleteReactionInternalEvent);
  }
}
