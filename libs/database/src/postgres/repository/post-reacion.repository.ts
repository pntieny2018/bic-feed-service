import { getDatabaseConfig } from '@libs/database/postgres/config';
import { PostReactionAttributes, PostReactionModel } from '@libs/database/postgres/model';
import { BaseRepository } from '@libs/database/postgres/repository';
import { InjectConnection } from '@nestjs/sequelize';
import { QueryTypes, Sequelize, Transaction } from 'sequelize';

export class LibPostReactionRepository extends BaseRepository<PostReactionModel> {
  public constructor(@InjectConnection() private readonly _sequelizeConnection: Sequelize) {
    super(PostReactionModel);
  }

  public async createPostReactionByStore(data: PostReactionAttributes): Promise<void> {
    const { schema } = getDatabaseConfig();
    const postId = data.postId;
    const userId = data.createdBy;
    const reactionName = data.reactionName;
    await this._sequelizeConnection.transaction(
      {
        isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
      },
      (t) => {
        return this._sequelizeConnection.query(`CALL ${schema}.create_post_reaction(?,?,?,null)`, {
          replacements: [postId, userId, reactionName],
          transaction: t,
          type: QueryTypes.SELECT,
        });
      }
    );
  }
}
