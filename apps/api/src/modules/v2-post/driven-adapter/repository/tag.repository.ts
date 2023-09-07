import { PaginationResult } from '@libs/database/postgres/common';
import {
  ILibTagRepository,
  LIB_TAG_REPOSITORY_TOKEN,
} from '@libs/database/postgres/repository/interface';
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
  GetPaginationTagProps,
  ITagRepository,
} from '../../domain/repositoty-interface';
import { TagMapper } from '../mapper/tag.mapper';

export class TagRepository implements ITagRepository {
  private _logger = new Logger(TagRepository.name);

  public constructor(
    @InjectConnection() private readonly _sequelizeConnection: Sequelize,
    @Inject(TAG_FACTORY_TOKEN) private readonly _factory: ITagFactory,
    @InjectModel(TagModel)
    private readonly _tagModel: typeof TagModel,
    @InjectModel(PostTagModel)
    private readonly _postTagModel: typeof PostTagModel,
    @Inject(LIB_TAG_REPOSITORY_TOKEN) private readonly _libTagRepository: ILibTagRepository,
    private readonly _tagMapper: TagMapper
  ) {}

  public async getPagination(input: GetPaginationTagProps): Promise<PaginationResult<TagEntity>> {
    const { offset, limit, name, groupIds } = input;
    const conditions = {};
    if (groupIds && groupIds.length) {
      conditions['groupId'] = groupIds;
    }
    if (name) {
      conditions['name'] = { [Op.iLike]: name + '%' };
    }
    const { rows, count } = await this._tagModel.findAndCountAll({
      attributes: TagModel.loadAllAttributes(),
      where: conditions,
      offset,
      limit,
      order: [
        ['totalUsed', 'DESC'],
        ['createdAt', 'DESC'],
      ],
    });
    const result = rows.map((row) => this._factory.reconstitute(row));
    return {
      rows: result,
      total: count,
    };
  }

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
    const tags = await this._libTagRepository.findAll(input);
    return tags.map((tag) => this._tagMapper.toDomain(tag));
  }

  private _modelToEntity(tag: TagModel): TagEntity {
    if (tag === null) {
      return null;
    }
    return this._factory.reconstitute(tag.toJSON());
  }
}
