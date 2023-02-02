import { Inject, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { FindOptions, Op, Sequelize } from 'sequelize';
import { PaginationResult } from '../../../../common/types/pagination-result.type';
import { PostTagModel } from '../../../../database/models/post-tag.model';
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
  private _logger = new Logger(TagRepository.name);
  @InjectModel(TagModel)
  private readonly _tagModel: typeof TagModel;
  @InjectModel(PostTagModel)
  private readonly _postTagModel: typeof PostTagModel;

  public constructor(@InjectConnection() private readonly _sequelizeConnection: Sequelize) {}

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
        where: { id: data.get('id') },
      }
    );
  }

  public async delete(id: string): Promise<void> {
    const transaction = await this._sequelizeConnection.transaction();
    try {
      await this._postTagModel.destroy({ where: { tagId: id }, transaction });
      await this._tagModel.destroy({ where: { id }, transaction });
      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      this._logger.error(JSON.stringify(e?.stack));
      throw new InternalServerErrorException();
    }
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
    if (model === null) return null;
    return TagEntity.fromJson(model);
  }
}
