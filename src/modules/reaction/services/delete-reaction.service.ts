import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CommentReactionModel } from '../../../database/models/comment-reaction.model';
import { PostReactionModel } from '../../../database/models/post-reaction.model';
import { UserDto } from '../../auth';
import { DeleteReactionDto } from '../dto/request';
import { ReactionEnum } from '../reaction.enum';
import { CommonReactionService } from './common-reaction.service';

@Injectable()
export class DeleteReactionService {
  private _logger = new Logger(DeleteReactionService.name);

  public constructor(
    @InjectModel(PostReactionModel) private readonly _postReactionModel: typeof PostReactionModel,
    @InjectModel(CommentReactionModel)
    private readonly _commentReactionModel: typeof CommentReactionModel,
    private readonly _commonReactionService: CommonReactionService
  ) {}

  /**
   * Delete reaction
   * @param userDto UserDto
   * @param deleteReactionDto DeleteReactionDto
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public deleteReaction(userDto: UserDto, deleteReactionDto: DeleteReactionDto): Promise<boolean> {
    const { id } = userDto;
    switch (deleteReactionDto.target) {
      case ReactionEnum.POST:
        return this._deletePostReaction(id, deleteReactionDto);
      case ReactionEnum.COMMENT:
        return this._deleteCommentReaction(id, deleteReactionDto);
      default:
        throw new NotFoundException('Reaction type not match.');
    }
  }

  /**
   * Delete post reaction
   * @param userId number
   * @param deleteReactionDto DeleteReactionDto
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  private async _deletePostReaction(
    userId: number,
    deleteReactionDto: DeleteReactionDto
  ): Promise<boolean> {
    const { reactionId } = deleteReactionDto;
    try {
      const existedReaction = await this._postReactionModel.findOne<PostReactionModel>({
        where: {
          id: reactionId,
        },
      });

      if (!!existedReaction === false) {
        throw new Error('Reaction id is not existed.');
      }

      if (existedReaction.createdBy !== userId) {
        throw new Error('Reaction is not created by user.');
      }

      await this._postReactionModel.destroy<PostReactionModel>({
        where: {
          id: reactionId,
        },
      });

      await this._commonReactionService.createDeleteReactionEvent(userId, {
        userId: userId,
        reactionName: existedReaction.reactionName,
        target: ReactionEnum.POST,
        targetId: existedReaction.postId,
      });

      return true;
    } catch (e) {
      this._logger.error(e, e?.stack);

      if (e?.message === 'Reaction id is not existed.') {
        throw new NotFoundException('Reaction id not found.');
      }

      throw e;
    }
  }

  /**
   * Delete comment reaction
   * @param userId number
   * @param deleteReactionDto DeleteReactionDto
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  private async _deleteCommentReaction(
    userId: number,
    deleteReactionDto: DeleteReactionDto
  ): Promise<boolean> {
    const { reactionId } = deleteReactionDto;
    try {
      const existedReaction = await this._commentReactionModel.findOne<CommentReactionModel>({
        where: {
          id: reactionId,
        },
      });

      if (!!existedReaction === false) {
        throw new Error('Reaction id is not existed.');
      }

      if (existedReaction.createdBy !== userId) {
        throw new Error('Reaction is not created by user.');
      }

      await this._commentReactionModel.destroy<CommentReactionModel>({
        where: {
          id: reactionId,
        },
      });

      await this._commonReactionService.createDeleteReactionEvent(userId, {
        userId: userId,
        reactionName: existedReaction.reactionName,
        target: ReactionEnum.COMMENT,
        targetId: existedReaction.commentId,
      });

      return true;
    } catch (e) {
      this._logger.error(e, e?.stack);

      if (e?.message === 'Reaction id is not existed.') {
        throw new NotFoundException('Reaction id not found.');
      }

      throw e;
    }
  }

  /**
   * Delete reaction by commentIds
   * @param commentIds number[]
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async deleteReactionByCommentIds(commentIds: number[]): Promise<number> {
    return await this._commentReactionModel.destroy({
      where: {
        commentId: commentIds,
      },
    });
  }
}
