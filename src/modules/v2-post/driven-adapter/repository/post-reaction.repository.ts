import {
  FindOnePostReactionProps,
  IPostReactionRepository,
} from '../../domain/repositoty-interface';
import { PostReactionEntity } from '../../domain/model/reaction';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { PostReactionModel } from '../../../../database/models/post-reaction.model';
import { Inject, Logger } from '@nestjs/common';
import { IPostReactionFactory, POST_REACTION_FACTORY_TOKEN } from '../../domain/factory';
import { FindOptions, Sequelize } from 'sequelize';

export class PostReactionRepository implements IPostReactionRepository {
  @Inject(POST_REACTION_FACTORY_TOKEN) private readonly _factory: IPostReactionFactory;
  @InjectModel(PostReactionModel)
  private readonly _postReactionModel: typeof PostReactionModel;
  private _logger = new Logger(PostReactionRepository.name);
  public constructor(@InjectConnection() private readonly _sequelizeConnection: Sequelize) {}

  public async findOne(input: FindOnePostReactionProps): Promise<PostReactionEntity> {
    const findOptions: FindOptions = { where: input };
    const postReaction = await this._postReactionModel.findOne(findOptions);
    return this._modelToEntity(postReaction);
  }

  public async create(data: PostReactionEntity): Promise<void> {
    await this._postReactionModel.create({
      id: data.get('id'),
      reactionName: data.get('reactionName'),
      createdBy: data.get('createdBy'),
      postId: data.get('postId'),
    });
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

  private _modelToEntity(postReaction: PostReactionModel): PostReactionEntity {
    if (postReaction === null) return null;
    return this._factory.reconstitute(postReaction.toJSON());
  }
}
