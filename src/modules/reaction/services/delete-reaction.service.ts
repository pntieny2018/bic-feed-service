import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
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
  ) {}

  /**
   * Delete reaction
   * @param userDto UserDto
   * @param deleteReactionDto DeleteReactionDto
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public deleteReaction(userDto: UserDto, deleteReactionDto: DeleteReactionDto): Promise<boolean> {
    const { userId } = userDto;
    switch (deleteReactionDto.target) {
      case ReactionEnum.POST:
        return this._deletePostReaction(userId, deleteReactionDto);
      case ReactionEnum.COMMENT:
        return this._deleteCommentReaction(userId, deleteReactionDto);
      default:
        throw new HttpException('Reaction type not match.', HttpStatus.NOT_FOUND);
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

      return true;
    } catch (e) {
      this._logger.error(e, e?.stack);
      throw new HttpException('Can not delete reaction.', HttpStatus.INTERNAL_SERVER_ERROR);
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

      return true;
    } catch (e) {
      this._logger.error(e, e?.stack);
      throw new HttpException('Can not delete reaction.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
