import { InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { FindOptions, Sequelize } from 'sequelize';
import { PostTagModel } from '../../../../database/models/post-tag.model';
import { ITag, TagModel } from '../../../../database/models/tag.model';
import { TagEntity, TagId } from '../../domain/model/tag';
import {
  FindAllTagsProps,
  FindOneTagProps,
  ITagRepository,
} from '../../domain/repositoty-interface';

export class TagRepository implements ITagRepository {
  private _logger = new Logger(TagRepository.name);
  @InjectModel(TagModel)
  private readonly _tagModel: typeof TagModel;
  @InjectModel(PostTagModel)
  private readonly _postTagModel: typeof PostTagModel;

  public constructor(@InjectConnection() private readonly _sequelizeConnection: Sequelize) {}

  public async create(data: TagEntity): Promise<void> {
    await this._tagModel.create({
      id: data.get('id').value,
      name: data.get('name').value,
      slug: data.get('slug').value,
      updatedBy: data.get('updatedBy').value,
      createdBy: data.get('createdBy').value,
      groupId: data.get('groupId').value,
      totalUsed: data.get('totalUsed').value,
    });
  }

  public async update(data: TagEntity): Promise<void> {
    await this._tagModel.update(
      {
        name: data.get('name').value,
        slug: data.get('slug').value,
        updatedBy: data.get('updatedBy').value,
        createdBy: data.get('createdBy').value,
        groupId: data.get('groupId').value,
        totalUsed: data.get('totalUsed').value,
      },
      {
        where: { id: data.get('id').value },
      }
    );
  }

  public async delete(id: TagId): Promise<void> {
    const transaction = await this._sequelizeConnection.transaction();
    try {
      await this._postTagModel.destroy({ where: { tagId: id.value }, transaction });
      await this._tagModel.destroy({ where: { id: id.value }, transaction });
      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      this._logger.error(JSON.stringify(e?.stack));
      throw e;
    }
  }

  public async findOne(input: FindOneTagProps): Promise<TagEntity> {
    const findOptions: FindOptions = { where: {} };
    if (input.id) {
      findOptions.where['id'] = input.id.value;
    }
    if (input.name) {
      findOptions.where['name'] = input.name.value;
    }
    if (input.groupId) {
      findOptions.where['groupId'] = input.groupId.value;
    }
    const entity = await this._tagModel.findOne(findOptions);
    return this._modelToEntity(entity);
  }

  public async findAll(input: FindAllTagsProps): Promise<TagEntity[]> {
    const { groupIds, name } = input;
    const condition: any = { groupId: groupIds.map((groupId) => groupId.value) };
    if (name) {
      condition.name = name.value.trim().toLowerCase();
    }
    const enties = await this._tagModel.findAll({
      where: condition,
    });
    const rows = enties.map((entity) => this._modelToEntity(entity));

    return rows;
  }

  private _modelToEntity(model: ITag): TagEntity {
    if (model === null) return null;
    return TagEntity.fromJson(model);
  }
}
