import { Inject, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { FindOptions, Sequelize } from 'sequelize';
import { PostReactionModel } from '../../../../database/models/post-reaction.model';
import { ReactionEntity } from '../../domain/model/reaction';
import {
  FindAllReactionsProps,
  IReactionRepository,
} from '../../domain/repositoty-interface';
import { IReactionFactory, REACTION_FACTORY_TOKEN } from '../../domain/factory';

export class ReactionRepository implements IReactionRepository {
  @Inject(REACTION_FACTORY_TOKEN) private readonly _factory: IReactionFactory;
  private _logger = new Logger(ReactionRepository.name);
  @InjectModel(ReactionModel)
  private readonly _reactionModel: typeof ReactionModel;
  @InjectModel(PostReactionModel)
  private readonly _postReactionModel: typeof PostReactionModel;

  public constructor(@InjectConnection() private readonly _sequelizeConnection: Sequelize) {}

  public async create(data: ReactionEntity): Promise<void> {
    await this._reactionModel.create({
      id: data.get('id'),
      name: data.get('name'),
      slug: data.get('slug'),
      updatedBy: data.get('updatedBy'),
      createdBy: data.get('createdBy'),
      groupId: data.get('groupId'),
      totalUsed: data.get('totalUsed'),
    });
  }

  public async update(data: ReactionEntity): Promise<void> {
    await this._reactionModel.update(
      {
        name: data.get('name'),
        slug: data.get('slug'),
        updatedBy: data.get('updatedBy'),
        createdBy: data.get('createdBy'),
        groupId: data.get('groupId'),
        totalUsed: data.get('totalUsed'),
      },
      {
        where: { id: data.get('id') },
      }
    );
  }

  public async delete(id: string): Promise<void> {
    const transaction = await this._sequelizeConnection.transaction();
    try {
      await this._postReactionModel.destroy({ where: { reactionId: id }, transaction });
      await this._reactionModel.destroy({ where: { id: id }, transaction });
      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      this._logger.error(JSON.stringify(e?.stack));
      throw e;
    }
  }

  public async findOne(input: FindOneReactionProps): Promise<ReactionEntity> {
    const findOptions: FindOptions = { where: {} };
    if (input.id) {
      findOptions.where['id'] = input.id;
    }
    if (input.name) {
      findOptions.where['name'] = input.name;
    }
    if (input.groupId) {
      findOptions.where['groupId'] = input.groupId;
    }
    const entity = await this._reactionModel.findOne(findOptions);
    return this._modelToEntity(entity);
  }

  public async findAll(input: FindAllReactionsProps): Promise<ReactionEntity[]> {
    const { groupIds, name } = input;
    const condition: any = { groupId: groupIds.map((groupId) => groupId) };
    if (name) {
      condition.name = name.trim().toLowerCase();
    }
    const enties = await this._reactionModel.findAll({
      where: condition,
    });
    const rows = enties.map((entity) => this._modelToEntity(entity));

    return rows;
  }

  private _modelToEntity(reaction: ReactionModel): ReactionEntity {
    if (reaction === null) return null;
    return this._factory.reconstitute(reaction.toJSON());
  }
}
