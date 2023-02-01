import { Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { FindOptions, Op } from 'sequelize';
import { PaginationResult } from '../../../../common/types/pagination-result.type';
import { ITag, TagModel } from '../../../../database/models/tag.model';
import { TagFactory } from '../../domain/factory/tag.factory';
import { TagEntity } from '../../domain/model/tag/tag.entity';
import {
  FindAllTagsProps,
  FindOneTagProps,
  GetPaginationTagProps,
  ITagRepository,
} from '../../domain/repositoty-interface/tag.repository.interface';

export class TagRepository implements ITagRepository {
  @Inject() private readonly _tagFactory: TagFactory;

  @InjectModel(TagModel)
  private readonly _tagModel: typeof TagModel;

  public async getPagination(input: GetPaginationTagProps): Promise<PaginationResult<TagEntity>> {
    const { offset, limit, name, groupIds } = input;
    const conditions = {
      groupId: groupIds,
    };
    if (name) {
      conditions['name'] = { [Op.iLike]: '%' + name + '%' };
    }
    const { rows, count } = await this._tagModel.findAndCountAll({
      where: conditions,
      offset,
      limit,
      order: [
        ['totalUsed', 'DESC'],
        ['createdAt', 'DESC'],
      ],
    });

    const result = rows.map((row) => this._modelToEntity(row));
    return {
      rows: result,
      total: count,
    };
  }

  public async create(data: TagEntity): Promise<void> {
    const { id, groupId, name, slug, createdBy, updatedBy, totalUsed } = data;
    await this._tagModel.create({
      id,
      name,
      slug,
      updatedBy,
      createdBy,
      groupId,
      totalUsed,
    });
  }

  public async update(data: TagEntity): Promise<void> {
    const property = this._entityToModel(data);
    const { id, groupId, name, slug, createdBy, updatedBy, totalUsed } = property;
    await this._tagModel.update(
      {
        name,
        slug,
        updatedBy,
        createdBy,
        groupId,
        totalUsed,
      },
      {
        where: { id },
      }
    );
  }

  public async delete(id: string): Promise<void> {
    await this._tagModel.destroy({ where: { id } });
  }

  public async findOne(input: FindOneTagProps): Promise<TagEntity> {
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
    const entity = await this._tagModel.findOne(findOptions);
    return this._modelToEntity(entity);
  }

  public async findAll(input: FindAllTagsProps): Promise<TagEntity[]> {
    const { groupIds, name } = input;
    const condition: any = { groupId: groupIds };
    if (name) {
      condition.name = name.trim().toLowerCase();
    }
    const enties = await this._tagModel.findAll({
      where: condition,
    });
    const rows = enties.map((entity) => this._modelToEntity(entity));

    return rows;
  }

  private _modelToEntity(model: ITag): TagEntity {
    return TagEntity.fromJson(model);
  }

  private _entityToModel(entity: TagEntity): ITag {
    if (entity === null) return null;
    return {
      id: entity.get('id'),
      groupId: entity.get('groupId'),
      name: entity.get('name'),
      slug: entity.get('slug'),
      totalUsed: entity.get('groupId'),
      createdAt: entity.get('createdAt'),
      updatedAt: entity.get('updatedAt'),
      createdBy: entity.get('createdBy'),
      updatedBy: entity.get('updatedBy'),
    }
  }
}
