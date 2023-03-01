import {
  FindOneCommentReactionProps,
  ICommentReactionRepository,
} from '../../domain/repositoty-interface';
import { CommentReactionEntity } from '../../domain/model/reaction';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { CommentReactionModel } from '../../../../database/models/comment-reaction.model';
import { Inject, Logger } from '@nestjs/common';
import { ICommentReactionFactory, POST_REACTION_FACTORY_TOKEN } from '../../domain/factory';
import { FindOptions, Sequelize } from 'sequelize';

export class CommentReactionRepository implements ICommentReactionRepository {
  @Inject(POST_REACTION_FACTORY_TOKEN) private readonly _factory: ICommentReactionFactory;
  @InjectModel(CommentReactionModel)
  private readonly _commentReactionModel: typeof CommentReactionModel;
  private _logger = new Logger(CommentReactionRepository.name);
  public constructor(@InjectConnection() private readonly _sequelizeConnection: Sequelize) {}

  public async findOne(input: FindOneCommentReactionProps): Promise<CommentReactionEntity> {
    const findOptions: FindOptions = { where: input };
    const commentReaction = await this._commentReactionModel.findOne(findOptions);
    return this._modelToEntity(commentReaction);
  }

  public async create(data: CommentReactionEntity): Promise<void> {
    await this._commentReactionModel.create({
      id: data.get('id'),
      reactionName: data.get('reactionName'),
      createdBy: data.get('createdBy'),
      commentId: data.get('commentId'),
    });
  }

  public async delete(id: string): Promise<void> {
    const transaction = await this._sequelizeConnection.transaction();
    try {
      await this._commentReactionModel.destroy({ where: { id: id }, transaction });
      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      this._logger.error(JSON.stringify(e?.stack));
      throw e;
    }
  }

  private _modelToEntity(commentReaction: CommentReactionModel): CommentReactionEntity {
    if (commentReaction === null) return null;
    return this._factory.reconstitute(commentReaction.toJSON());
  }
}
