import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreateReactionDto } from './dto/request';
import { PostReactionModel } from '../../database/models/post-reaction.model';
import { CommentReactionModel } from 'src/database/models/comment-reaction.model';
import { ReactionEnum } from './reaction.enum';
import { UserDto } from '../auth';
import { REACTION_SERVICE, TOPIC_REACTION_CREATED, TOPIC_REACTION_DELETED } from './reaction.constants';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class ReactionService {
  private _logger = new Logger(ReactionService.name);

  public constructor(
    @InjectModel(PostReactionModel)
    private readonly _postReactionModel: typeof PostReactionModel,
    @InjectModel(CommentReactionModel)
    private readonly _commentReactionModel: typeof CommentReactionModel,
    @Inject(REACTION_SERVICE)
    private readonly _clientKafka: ClientKafka
  ) {}

  /**
   * Handle reaction
   * @param user UserDto
   * @param createReactionDto CreateReactionDto
   * @param creationFlag boolean
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async handleReaction(
    user: UserDto,
    createReactionDto: CreateReactionDto,
    creationFlag: boolean
  ): Promise<boolean> {
    const { userId } = user;

    switch (createReactionDto.target) {
      case ReactionEnum.POST:
        await this.handlePostReaction(userId, createReactionDto, creationFlag);
        break;
      case ReactionEnum.COMMENT:
        await this.handleCommentReaction(userId, createReactionDto, creationFlag);
        break;
      default:
        throw new HttpException('Reaction type not match.', HttpStatus.NOT_FOUND);
    }

    const topic = creationFlag ? TOPIC_REACTION_CREATED : TOPIC_REACTION_DELETED;

    this._clientKafka.emit(topic, JSON.stringify(createReactionDto));

    return true;
  }

  /**
   * Handle post reaction
   * @param userId number
   * @param createReactionDto CreateReactionDto
   * @param creationFlag boolean
   * @returns Promise resolve boolean
   * @throws Error
   */
  public async handlePostReaction(
    userId: number,
    createReactionDto: CreateReactionDto,
    creationFlag: boolean
  ): Promise<boolean> {
    const { reactionName, targetId } = createReactionDto;

    try {
      const existedReaction = await this._postReactionModel.findOne<PostReactionModel>({
        where: {
          postId: targetId,
          reactionName: reactionName,
          createdBy: userId,
        },
      });

      if (creationFlag === !!existedReaction) {
        throw new Error(`Reaction existence is ${!!existedReaction}`);
      }

      if (creationFlag === true) {
        await this._postReactionModel.create<PostReactionModel>({
          postId: targetId,
          reactionName: reactionName,
          createdBy: userId,
        });
      } else {
        await this._postReactionModel.destroy<PostReactionModel>({
          where: {
            id: existedReaction.id,
          },
        });
      }

      return true;
    } catch (e) {
      this._logger.error(e, e?.stack);
      throw e;
    }
  }

  /**
   * Handle comment reaction
   * @param userId number
   * @param createReactionDto CreateReactionDto
   * @returns Promise resolve boolean
   * @throws Error
   */
  public async handleCommentReaction(
    userId: number,
    createReactionDto: CreateReactionDto,
    creationFlag: boolean
  ): Promise<boolean> {
    const { reactionName, targetId } = createReactionDto;

    try {
      const existedReaction = await this._commentReactionModel.findOne<CommentReactionModel>({
        where: {
          commentId: targetId,
          reactionName: reactionName,
          createdBy: userId,
        },
      });

      if (creationFlag === !!existedReaction) {
        throw new Error(`Reaction existence is ${!!existedReaction}`);
      }

      if (creationFlag === true) {
        await this._commentReactionModel.create<CommentReactionModel>({
          commentId: targetId,
          reactionName: reactionName,
          createdBy: userId,
        });
      } else {
        await this._commentReactionModel.destroy<CommentReactionModel>({
          where: {
            id: existedReaction.id,
          },
        });
      }

      return true;
    } catch (e) {
      this._logger.error(e, e?.stack);
      throw e;
    }
  }
}
