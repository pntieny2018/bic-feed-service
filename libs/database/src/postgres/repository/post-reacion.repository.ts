import { getDatabaseConfig } from '@libs/database/postgres/common';
import {
  PostReactionAttributes,
  PostReactionModel,
} from '@libs/database/postgres/model/post-reaction.model';
import {
  FindOnePostReactionProps,
  ILibPostReactionRepository,
} from '@libs/database/postgres/repository/interface';
import { Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { FindOptions, QueryTypes, Sequelize, Transaction } from 'sequelize';

export class LibPostReactionRepository implements ILibPostReactionRepository {
  public constructor(
    @InjectModel(PostReactionModel)
    private readonly _postReactionModel: typeof PostReactionModel,
    @InjectConnection() private readonly _sequelizeConnection: Sequelize
  ) {}
  private _logger = new Logger(LibPostReactionRepository.name);

  public async findOne(input: FindOnePostReactionProps): Promise<PostReactionModel> {
    const findOptions: FindOptions = { where: input };
    return this._postReactionModel.findOne(findOptions);
  }

  public async create(data: PostReactionAttributes): Promise<void> {
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

  public async delete(id: string): Promise<void> {
    const transaction = await this._sequelizeConnection.transaction();
    try {
      await this._postReactionModel.destroy({ where: { id: id }, transaction });
      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      this._logger.error(JSON.stringify(e?.stack));
      throw e;
    }
  }
}
