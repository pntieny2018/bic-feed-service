import { getDatabaseConfig } from '@libs/database/postgres/common';
import {
  CommentReactionAttributes,
  CommentReactionModel,
} from '@libs/database/postgres/model/comment-reaction.model';
import {
  FindOneCommentReactionProps,
  ILibCommentReactionRepository,
} from '@libs/database/postgres/repository/interface';
import { Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { FindOptions, QueryTypes, Sequelize, Transaction } from 'sequelize';

export class LibCommentReactionRepository implements ILibCommentReactionRepository {
  private _logger = new Logger(LibCommentReactionRepository.name);
  public constructor(
    @InjectModel(CommentReactionModel)
    private readonly _commentReactionModel: typeof CommentReactionModel,
    @InjectConnection() private readonly _sequelizeConnection: Sequelize
  ) {}

  public async findOne(input: FindOneCommentReactionProps): Promise<CommentReactionModel> {
    const findOptions: FindOptions = { where: input };
    return this._commentReactionModel.findOne(findOptions);
  }

  public async create(data: CommentReactionAttributes): Promise<void> {
    const { schema } = getDatabaseConfig();
    const commentId = data.commentId;
    const userId = data.createdBy;
    const reactionName = data.reactionName;
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
}
