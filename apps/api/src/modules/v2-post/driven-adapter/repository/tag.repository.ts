import { Inject, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { FindOptions, Op, Sequelize } from 'sequelize';
import { PostTagModel } from '../../../../database/models/post-tag.model';
import { TagModel } from '../../../../database/models/tag.model';
import { ITagFactory, TAG_FACTORY_TOKEN } from '../../domain/factory/interface';
import { TagEntity } from '../../domain/model/tag';
import {
  FindAllTagsProps,
  FindOneTagProps,
  ITagRepository,
} from '../../domain/repositoty-interface';

export class TagRepository implements ITagRepository {
  @Inject(TAG_FACTORY_TOKEN) private readonly _factory: ITagFactory;
  private _logger = new Logger(TagRepository.name);
  @InjectModel(TagModel)
  private readonly _tagModel: typeof TagModel;
  @InjectModel(PostTagModel)
  private readonly _postTagModel: typeof PostTagModel;

  public constructor(@InjectConnection() private readonly _sequelizeConnection: Sequelize) {}

  public async create(data: TagEntity): Promise<void> {
    await this._tagModel.create({
      id: data.get('id'),
      name: data.get('name'),
      slug: data.get('slug'),
      updatedBy: data.get('updatedBy'),
      createdBy: data.get('createdBy'),
      groupId: data.get('groupId'),
      totalUsed: data.get('totalUsed'),
    });
  }

  public async update(data: TagEntity): Promise<void> {
    await this._tagModel.update(
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
      await this._postTagModel.destroy({ where: { tagId: id }, transaction });
      await this._tagModel.destroy({ where: { id: id }, transaction });
      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      this._logger.error(JSON.stringify(e?.stack));
      throw e;
    }
  }

  public async findOne(input: FindOneTagProps): Promise<TagEntity> {
    const findOptions: FindOptions = {
      attributes: TagModel.loadAllAttributes(),
      where: {},
    };
    if (input.id) {
      findOptions.where['id'] = input.id;
    }
    if (input.name) {
      findOptions.where['name'] = input.name;
    }
    if (input.groupId) {
      findOptions.where['groupId'] = input.groupId;
    }
    const entity = await this._tagModel.findOne(findOptions);
    return this._modelToEntity(entity);
  }

  public async findAll(input: FindAllTagsProps): Promise<TagEntity[]> {
    const { groupIds, name, ids, keyword } = input;
    const condition: any = {};
    if (ids) {
      condition.id = ids;
    }
    if (groupIds) {
      condition.groupId = groupIds;
    }
    if (name) {
      condition.name = name.trim().toLowerCase();
    }
    if (keyword) {
      condition.name = {
        [Op.iLike]: `%${keyword}%`,
      };
    }
    const entities = await this._tagModel.findAll({
      where: condition,
    });

    return entities.map((entity) => this._modelToEntity(entity));
  }

  private _modelToEntity(tag: TagModel): TagEntity {
    if (tag === null) {
      return null;
    }
    return this._factory.reconstitute(tag.toJSON());
  }
}
