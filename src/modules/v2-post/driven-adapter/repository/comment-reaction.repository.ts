import {
  FindOneCommentReactionProps,
  ICommentReactionRepository,
} from '../../domain/repositoty-interface';
import { ReactionEntity } from '../../domain/model/reaction';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { CommentReactionModel } from '../../../../database/models/comment-reaction.model';
import { Inject, Logger } from '@nestjs/common';
import { IReactionFactory, REACTION_FACTORY_TOKEN } from '../../domain/factory';
import { FindOptions, QueryTypes, Sequelize, Transaction } from 'sequelize';
import { getDatabaseConfig } from '../../../../config/database';

export class CommentReactionRepository implements ICommentReactionRepository {
  @Inject(REACTION_FACTORY_TOKEN) private readonly _factory: IReactionFactory;
  @InjectModel(CommentReactionModel)
  private readonly _commentReactionModel: typeof CommentReactionModel;
  private _logger = new Logger(CommentReactionRepository.name);
  public constructor(@InjectConnection() private readonly _sequelizeConnection: Sequelize) {}

  public async findOne(input: FindOneCommentReactionProps): Promise<ReactionEntity> {
    const findOptions: FindOptions = { where: input };
    const commentReaction = await this._commentReactionModel.findOne(findOptions);
    return this._modelToEntity(commentReaction);
  }

  public async create(data: ReactionEntity): Promise<void> {
    const { schema } = getDatabaseConfig();
    const commentId = data.get('targetId');
    const userId = data.get('createdBy');
    const reactionName = data.get('reactionName');
    await this._sequelizeConnection.transaction(
      {
        isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
      },
      (t) => {
        return this._sequelizeConnection.query(
          `CALL ${schema}.create_comment_reaction(?,?,?,null)`,
          {
            replacements: [commentId, userId, reactionName],
            transaction: t,
            type: QueryTypes.SELECT,
          }
        );
      }
    );
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

  private _modelToEntity(commentReaction: CommentReactionModel): ReactionEntity {
    if (commentReaction === null) return null;
    return this._factory.reconstitute({
      ...commentReaction.toJSON(),
      targetId: commentReaction.commentId,
    });
  }
}
