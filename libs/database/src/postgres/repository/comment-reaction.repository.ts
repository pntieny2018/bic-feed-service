import { getDatabaseConfig } from '@libs/database/postgres/common';
import { CommentReactionAttributes, CommentReactionModel } from '@libs/database/postgres/model';
import { BaseRepository } from '@libs/database/postgres/repository';
import { Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { QueryTypes, Sequelize, Transaction } from 'sequelize';

export class LibCommentReactionRepository extends BaseRepository<CommentReactionModel> {
  private _logger = new Logger(LibCommentReactionRepository.name);
  public constructor(@InjectConnection() private readonly _sequelizeConnection: Sequelize) {
    super(CommentReactionModel);
  }

  public async createCommentReactionByStore(data: CommentReactionAttributes): Promise<void> {
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
}
