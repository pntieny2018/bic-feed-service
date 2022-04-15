import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { InternalEventEmitterService } from '../../../app/custom/event-emitter';
import { CommentReactionModel } from '../../../database/models/comment-reaction.model';
import { PostReactionModel } from '../../../database/models/post-reaction.model';
import { CreateReactionInternalEvent, DeleteReactionInternalEvent } from '../../../events/reaction';
import { UserService } from '../../../shared/user';
import { UserSharedDto } from '../../../shared/user/dto';
import { UserDto } from '../../auth';
import { CommentService } from '../../comment';
import { GetPostDto } from '../../post/dto/requests';
import { PostService } from '../../post/post.service';
import { ReactionDto } from '../dto/reaction.dto';
import { CreateReactionDto } from '../dto/request';
import { ReactionEnum } from '../reaction.enum';

@Injectable()
export class CommonReactionService {
  public constructor(
    @InjectModel(PostReactionModel) private readonly _postReactionModel: typeof PostReactionModel,
    @InjectModel(CommentReactionModel)
    private readonly _commentReactionModel: typeof CommentReactionModel,
    private readonly _internalEventEmitterService: InternalEventEmitterService,
    private readonly _userService: UserService,
    @Inject(forwardRef(() => PostService))
    private readonly _postService: PostService,
    @Inject(forwardRef(() => CommentService))
    private readonly _commentService: CommentService
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
   * @param userDto UserDto
   * @param userSharedDto UserSharedDto
   * @param reaction ReactionDto
   * @param postId number
   * @param commentId number
   * @returns void
   */
  public async createCreateReactionEvent(
    userDto: UserDto,
    userSharedDto: UserSharedDto,
    reaction: ReactionDto,
    postId: number,
    commentId?: number
  ): Promise<void> {
    const postResponseDto = await this._postService.getPost(
      postId,
      userDto,
      new GetPostDto({ commentLimit: 0, childCommentLimit: 0 })
    );
    const commentResponseDto =
      !!commentId === false ? null : await this._commentService.getComment(userDto, commentId, 0);

    const createReactionInternalEvent = new CreateReactionInternalEvent({
      userSharedDto: userSharedDto,
      reaction: reaction,
      post: postResponseDto,
      comment: commentResponseDto,
    });

    this._internalEventEmitterService.emit(createReactionInternalEvent);
  }

  /**
   * Create delete-reaction event
   * @param userDto UserDto
   * @param reaction ReactionDto
   * @returns Promise resolve void
   */
  public async createDeleteReactionEvent(
    userDto: UserDto,
    reaction: ReactionDto,
    postId: number,
    commentId?: number
  ): Promise<void> {
    const userSharedDto = await this._userService.get(userDto.id);

    let post = null;
    let comment = null;

    if (reaction.target === ReactionEnum.POST) {
      post = await this._postService.getPost(
        postId,
        userDto,
        new GetPostDto({ commentLimit: 0, childCommentLimit: 0 })
      );
    } else {
      comment = await this._commentService.getComment(userDto, commentId, 0);
    }

    const deleteReactionInternalEvent = new DeleteReactionInternalEvent({
      userSharedDto: userSharedDto,
      reaction: reaction,
      post: post,
      comment: comment,
    });
    this._internalEventEmitterService.emit(deleteReactionInternalEvent);
  }
}
