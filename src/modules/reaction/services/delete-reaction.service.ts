import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CommentReactionModel } from '../../../database/models/comment-reaction.model';
import { PostReactionModel } from '../../../database/models/post-reaction.model';
import { UserDto } from '../../auth';
import { ReactionDto } from '../dto/reaction.dto';
import { CreateReactionDto } from '../dto/request';
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
   * @param createReactionDto CreateReactionDto
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public deleteReaction(
    userDto: UserDto,
    createReactionDto: CreateReactionDto
  ): Promise<ReactionDto> {
    const { id } = userDto;
    switch (createReactionDto.target) {
      case ReactionEnum.POST:
        return this._deletePostReaction(id, createReactionDto);
      case ReactionEnum.COMMENT:
        return this._deleteCommentReaction(id, createReactionDto);
      default:
        throw new HttpException('Reaction type not match.', HttpStatus.NOT_FOUND);
    }
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
  ): Promise<ReactionDto> {
    const { reactionName, targetId: postId } = createReactionDto;
    try {
      const isExistedReaction = await this._commonReactionService.isExistedPostReaction(
        userId,
        createReactionDto
      );
      if (!!isExistedReaction === false) {
        throw new Error('Reaction is not existed.');
      }

      await this._postReactionModel.destroy<PostReactionModel>({
        where: {
          postId: postId,
          reactionName: reactionName,
          createdBy: userId,
        },
      });

      const reactionDto = new ReactionDto(createReactionDto, userId);
      return reactionDto;
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
  ): Promise<ReactionDto> {
    const { reactionName, targetId: commentId } = createReactionDto;
    try {
      const isExistedReaction = await this._commonReactionService.isExistedCommentReaction(
        userId,
        createReactionDto
      );
      if (!!isExistedReaction === false) {
        throw new Error('Reaction is not existed.');
      }

      await this._commentReactionModel.destroy<CommentReactionModel>({
        where: {
          commentId: commentId,
          reactionName: reactionName,
          createdBy: userId,
        },
      });

      const reactionDto = new ReactionDto(createReactionDto, userId);
      return reactionDto;
    } catch (e) {
      this._logger.error(e, e?.stack);
      throw new HttpException('Can not delete reaction.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
