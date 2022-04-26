import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CommentReactionModel } from '../../../database/models/comment-reaction.model';
import { PostReactionModel } from '../../../database/models/post-reaction.model';
import { UserDto } from '../../auth';
import { ReactionDto } from '../dto/reaction.dto';
import { DeleteReactionDto } from '../dto/request';
import { ReactionEnum } from '../reaction.enum';
import { CommonReactionService } from './common-reaction.service';
import { ConfigService } from '@nestjs/config';
import { Transaction } from 'sequelize';

@Injectable()
export class DeleteReactionService {
  private _logger = new Logger(DeleteReactionService.name);

  public constructor(
    @InjectModel(PostReactionModel) private readonly _postReactionModel: typeof PostReactionModel,
    @InjectModel(CommentReactionModel)
    private readonly _commentReactionModel: typeof CommentReactionModel,
    private readonly _commonReactionService: CommonReactionService,
    private readonly _configService: ConfigService
  ) {}

  /**
   * Delete reaction
   * @param userDto UserDto
   * @param deleteReactionDto DeleteReactionDto
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public deleteReaction(userDto: UserDto, deleteReactionDto: DeleteReactionDto): Promise<boolean> {
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
  ): Promise<boolean> {
    this._logger.debug(`[_deletePostReaction]: ${JSON.stringify(deleteReactionDto)}`);
    const { id: userId } = userDto;
    try {
      const condition = {};
      if (deleteReactionDto.reactionId) {
        condition['reactionId'] = deleteReactionDto.reactionId;
      }
      if (deleteReactionDto.reactionName) {
        condition['reactionName'] = deleteReactionDto.reactionName;
      }
      const existedReaction = await this._postReactionModel.findOne<PostReactionModel>({
        where: {
          ...condition,
          createdBy: userId,
        },
      });

      if (!existedReaction) {
        return false;
      }
      await existedReaction.destroy();

      await this._commonReactionService.createDeleteReactionEvent(
        userDto,
        new ReactionDto(
          {
            reactionName: existedReaction.reactionName,
            target: ReactionEnum.POST,
            targetId: existedReaction.postId,
          },
          {
            userId: userDto.id,
            createdAt: existedReaction.createdAt,
            reactionId: existedReaction.id,
          }
        ),
        existedReaction.postId
      );

      return true;
    } catch (e) {
      this._logger.error(e, e?.stack);
      throw e;
    }
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
  ): Promise<boolean> {
    const { id: userId } = userDto;
    try {
      const condition = {};
      if (deleteReactionDto.reactionId) {
        condition['reactionId'] = deleteReactionDto.reactionId;
      }
      if (deleteReactionDto.reactionName) {
        condition['reactionName'] = deleteReactionDto.reactionName;
      }

      const existedReaction = await this._commentReactionModel.findOne({
        where: {
          ...condition,
          createdBy: userId,
        },
      });

      if (!existedReaction) {
        return false;
      }

      await this._commentReactionModel.destroy();

      await this._commonReactionService.createDeleteReactionEvent(
        userDto,
        new ReactionDto(
          {
            reactionName: existedReaction.reactionName,
            target: ReactionEnum.COMMENT,
            targetId: existedReaction.commentId,
          },
          {
            userId: userDto.id,
            createdAt: existedReaction.createdAt,
            reactionId: existedReaction.id,
          }
        ),
        null,
        existedReaction.commentId
      );

      return true;
    } catch (e) {
      this._logger.error(e, e?.stack);
      throw e;
    }
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
   * @param transaction Transaction
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async deleteReactionByPostIds(
    postIds: number[],
    transaction: Transaction
  ): Promise<number> {
    return await this._postReactionModel.destroy({
      where: {
        postId: postIds,
      },
      transaction,
    });
  }
}
