import { Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize/types';
import { PaginationResult } from '../../../../common/types/pagination-result.type';
import { ITagEntity, TagModel } from '../../../../database/models/tag.model';
import { Tag, TagProperties } from '../../domain/model/tag/tag';
import { TagFactory } from '../../domain/model/tag/tag.factory';
import {
  FindAllTagsProps,
  FindOneTagProps,
  GetPaginationTagProps,
  ITagRepository,
} from '../../domain/repositoty-interface/tag.repository.interface';

export class TagRepository implements ITagRepository {
  public constructor(
    @InjectModel(TagModel)
    private readonly _tagModel: typeof TagModel,
    @Inject() private readonly _tagFactory: TagFactory
  ) {}

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

  public async save(data: Tag): Promise<void> {
    const property = this._modelToEntity(data);
    const { id, groupId, name, slug, createdBy, updatedBy } = property;
    await this._tagModel.create({
      id,
      name,
      slug,
      updatedBy,
      createdBy,
      groupId,
    });
  }

  public async delete(id: string): Promise<void> {
    await this._tagModel.destroy({ where: { id } });
  }

  public async findOne(input: FindOneTagProps): Promise<Tag> {
    const entity = await this._tagModel.findOne({
      where: {
        id: input.id,
      },
    });
    return this._entityToModel(entity);
  }

  public async findAll(input: FindAllTagsProps): Promise<Tag[]> {
    const { groupIds, name } = input;
    const condition: any = { groupId: groupIds };
    if (name) {
      condition.name = name;
    }
    const enties = await this._tagModel.findAll({
      where: condition,
    });
    const rows = enties.map((entity) => this._entityToModel(entity));

    return rows;
  }

  private _modelToEntity(model: Tag): ITagEntity {
    const properties = JSON.parse(JSON.stringify(model)) as TagProperties;
    return properties;
  }

  private _entityToModel(entity: ITagEntity): Tag {
    return this._tagFactory.reconstitute({
      ...entity,
      id: entity.id,
      name: entity.name,
    });
  }
}
