import { Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { FindOptions, Op } from 'sequelize';
import { PaginationResult } from '../../../../common/types/pagination-result.type';
import { ITagEntity, TagModel } from '../../../../database/models/tag.model';
import { Tag } from '../../domain/model/tag/tag';
import { TagFactory } from '../../domain/model/tag/tag.factory';
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

  public async getPagination(input: GetPaginationTagProps): Promise<PaginationResult<Tag>> {
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

    const result = rows.map((row) => this._entityToModel(row));
    return {
      rows: result,
      total: count,
    };
  }

  public async create(data: Tag): Promise<void> {
    const property = this._modelToEntity(data);
    const { id, groupId, name, slug, createdBy, updatedBy, totalUsed } = property;
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

  public async update(data: Tag): Promise<void> {
    const property = this._modelToEntity(data);
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

  public async findOne(input: FindOneTagProps): Promise<Tag> {
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
    return this._entityToModel(entity);
  }

  public async findAll(input: FindAllTagsProps): Promise<Tag[]> {
    const { groupIds, name } = input;
    const condition: any = { groupId: groupIds };
    if (name) {
      condition.name = name.trim().toLowerCase();
    }
    const enties = await this._tagModel.findAll({
      where: condition,
    });
    const rows = enties.map((entity) => this._entityToModel(entity));

    return rows;
  }

  private _modelToEntity(model: Tag): ITagEntity {
    return {
      id: model.id,
      groupId: model.groupId,
      name: model.name,
      slug: model.slug,
      totalUsed: model.totalUsed,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      createdBy: model.createdBy,
      updatedBy: model.updatedBy,
    };
  }

  private _entityToModel(entity: ITagEntity): Tag {
    if (entity === null) return null;
    return this._tagFactory.reconstitute(entity);
  }
}
