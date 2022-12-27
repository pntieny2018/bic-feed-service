import { Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize/types';
import { ITagEntity, TagModel } from '../../../../database/models/tag.model';
import { ITag, TagProperties } from '../../domain/model/tag/tag';
import { TagFactory } from '../../domain/model/tag/tag.factory';
import {
  GetTagListProps,
  GetTagListResult,
  ITagRepository,
} from '../../domain/repositoty-interface/tag.repository.interface';

export class TagRepository implements ITagRepository {
  public constructor(
    @InjectModel(TagModel)
    private readonly _tagModel: typeof TagModel,
    @Inject() private readonly _tagFactory: TagFactory
  ) {}

  public async getList(input: GetTagListProps): Promise<GetTagListResult> {
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

  public async save(data: ITag): Promise<void> {
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

  public async findOne(id: string): Promise<ITag> {
    const entity = await this._tagModel.findByPk(id);
    return this._entityToModel(entity);
  }

  private _modelToEntity(model: ITag): ITagEntity {
    const properties = JSON.parse(JSON.stringify(model)) as TagProperties;
    return properties;
  }

  private _entityToModel(entity: ITagEntity): ITag {
    return this._tagFactory.reconstitute(entity);
  }
}
