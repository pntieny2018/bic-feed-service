import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CommentReactionModel } from 'src/database/models/comment-reaction.model';
import { PostReactionModel } from 'src/database/models/post-reaction.model';
import { UserDto } from 'src/modules/auth';
import { CreateReactionDto } from '../dto/request';
import { ReactionEnum } from '../reaction.enum';

@Injectable()
export class DeleteReactionService {
  private _logger = new Logger(DeleteReactionService.name);

  public constructor(
    @InjectModel(PostReactionModel) private readonly _postReactionModel: typeof PostReactionModel,
    @InjectModel(CommentReactionModel)
    private readonly _commentReactionModel: typeof CommentReactionModel
  ) {}

  /**
   * Delete reaction
   * @param userDto UserDto
   * @param createReactionDto CreateReactionDto
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public deleteReaction(userDto: UserDto, createReactionDto: CreateReactionDto): Promise<boolean> {
    const { userId } = userDto;
    switch (createReactionDto.target) {
      case ReactionEnum.POST:
        return this._deletePostReaction(userId, createReactionDto);
      case ReactionEnum.COMMENT:
        return this._deleteCommentReaction(userId, createReactionDto);
      default:
        throw new HttpException('Reaction type not match.', HttpStatus.NOT_FOUND);
    }
    //TODO: pub topic to kafka
  }

  /**
   * Delete post reaction
   * @param userId number
   * @param createReactionDto CreateReactionDto
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  private async _deletePostReaction(
    userId: number,
    createReactionDto: CreateReactionDto
  ): Promise<boolean> {
    const { reactionName, targetId: postId } = createReactionDto;
    try {
      const existedReaction = await this._postReactionModel.findOne<PostReactionModel>({
        where: {
          postId: postId,
          reactionName: reactionName,
          createdBy: userId,
        },
      });
      if (!!existedReaction === false) {
        throw new Error('Reaction is not existed.');
      }

      await this._postReactionModel.destroy<PostReactionModel>({
        where: {
          id: existedReaction.id,
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
   * @param createReactionDto CreateReactionDto
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  private async _deleteCommentReaction(
    userId: number,
    createReactionDto: CreateReactionDto
  ): Promise<boolean> {
    const { reactionName, targetId: commentId } = createReactionDto;
    try {
      const existedReaction = await this._commentReactionModel.findOne<CommentReactionModel>({
        where: {
          commentId: commentId,
          reactionName: reactionName,
          createdBy: userId,
        },
      });
      if (!!existedReaction === false) {
        throw new Error('Reaction is not existed.');
      }

      await this._commentReactionModel.destroy<CommentReactionModel>({
        where: {
          id: existedReaction.id,
        },
      });

      return true;
    } catch (e) {
      this._logger.error(e, e?.stack);
      throw new HttpException('Can not delete reaction.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
