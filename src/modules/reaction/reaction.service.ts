import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreateReactionDto } from './dto/request';
import { PostReactionModel } from '../../database/models/post-reaction.model';
import { CommentReactionModel } from 'src/database/models/comment-reaction.model';
import { ReactionEnum } from './reaction.enum';
import { UserDto } from '../auth';

@Injectable()
export class ReactionService {
  private _logger = new Logger(ReactionService.name);

  public constructor(
    @InjectModel(PostReactionModel)
    private readonly _postReactionModel: typeof PostReactionModel,
    @InjectModel(CommentReactionModel)
    private readonly _commentReactionModel: typeof CommentReactionModel
  ) {}

  /**
   * Create reaction
   * @param user UserDto
   * @param createReactionDto CreateReactionDto
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public createReaction(user: UserDto, createReactionDto: CreateReactionDto): Promise<boolean> {
    const { userId } = user;
    switch (createReactionDto.target) {
      case ReactionEnum.POST:
        return this._createPostReaction(userId, createReactionDto);
      case ReactionEnum.COMMENT:
        return this._createCommentReaction(userId, createReactionDto);
      default:
        throw new HttpException('Reaction type not match.', HttpStatus.NOT_FOUND);
    }
  }

  /**
   * Create post reaction
   * @param userId number
   * @param createReactionDto CreateReactionDto
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  private async _createPostReaction(userId: number, createReactionDto: CreateReactionDto): Promise<boolean> {
    const { reactionName, targetId: postId } = createReactionDto;
    try {
      const existedReaction = await this._postReactionModel.findOne<PostReactionModel>({
        where: {
          postId: postId,
          reactionName: reactionName,
          createdBy: userId,
        },
      });

      if (!!existedReaction === true) {
        throw new Error('Reaction is existed.');
      }

      await this._postReactionModel.create<PostReactionModel>({
        postId: postId,
        reactionName: reactionName,
        createdBy: userId,
      });

      return true;
    } catch (e) {
      this._logger.error(e, e?.stack);
      throw new HttpException('Can not create reaction.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Create comment reaction
   * @param userId number
   * @param createReactionDto CreateReactionDto
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  private async _createCommentReaction(userId: number, createReactionDto: CreateReactionDto): Promise<boolean> {
    const { reactionName, targetId: commentId } = createReactionDto;
    try {
      const existedReaction = await this._commentReactionModel.findOne<CommentReactionModel>({
        where: {
          commentId: commentId,
          reactionName: reactionName,
          createdBy: userId,
        },
      });

      if (!!existedReaction === true) {
        throw new Error('Reaction is existed.');
      }

      await this._commentReactionModel.create<CommentReactionModel>({
        commentId: commentId,
        reactionName: reactionName,
        createdBy: userId,
      });

      return true;
    } catch (e) {
      this._logger.error(e, e?.stack);
      throw new HttpException('Can not create reaction.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
