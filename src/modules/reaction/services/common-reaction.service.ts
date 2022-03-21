import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CommentReactionModel } from '../../../database/models/comment-reaction.model';
import { PostReactionModel } from '../../../database/models/post-reaction.model';
import { CreateReactionDto } from '../dto/request';

@Injectable()
export class CommonReactionService {
  public constructor(
    @InjectModel(PostReactionModel) private readonly _postReactionModel: typeof PostReactionModel,
    @InjectModel(CommentReactionModel)
    private readonly _commentReactionModel: typeof CommentReactionModel
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
}
