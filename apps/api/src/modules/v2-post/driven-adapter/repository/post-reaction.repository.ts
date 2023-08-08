import { Inject, Logger } from '@nestjs/common';
import { getDatabaseConfig } from '../../../../config/database';
import { FindOptions, QueryTypes, Sequelize, Transaction } from 'sequelize';
import { ReactionEntity } from '../../domain/model/reaction';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import {
  IReactionFactory,
  REACTION_FACTORY_TOKEN,
} from '../../domain/factory/interface/reaction.factory.interface';
import { REACTION_TARGET } from '../../data-type/reaction.enum';
import {
  FindOnePostReactionProps,
  IPostReactionRepository,
} from '../../domain/repositoty-interface';
import { PostReactionModel } from '../../../../database/models/post-reaction.model';

export class PostReactionRepository implements IPostReactionRepository {
  @Inject(REACTION_FACTORY_TOKEN) private readonly _factory: IReactionFactory;
  @InjectModel(PostReactionModel)
  private readonly _postReactionModel: typeof PostReactionModel;
  private _logger = new Logger(PostReactionRepository.name);
  public constructor(@InjectConnection() private readonly _sequelizeConnection: Sequelize) {}

  public async findOne(input: FindOnePostReactionProps): Promise<ReactionEntity> {
    const findOptions: FindOptions = { where: input };
    const postReaction = await this._postReactionModel.findOne(findOptions);
    return this._modelToEntity(postReaction);
  }

  public async create(data: ReactionEntity): Promise<void> {
    const { schema } = getDatabaseConfig();
    const postId = data.get('targetId');
    const userId = data.get('createdBy');
    const reactionName = data.get('reactionName');
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

  private _modelToEntity(postReaction: PostReactionModel): ReactionEntity {
    if (postReaction === null) return null;
    return this._factory.reconstitute({
      ...postReaction.toJSON(),
      targetId: postReaction.postId,
      target: REACTION_TARGET.POST,
    });
  }
}
