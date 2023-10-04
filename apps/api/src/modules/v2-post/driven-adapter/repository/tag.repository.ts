import { PaginationResult } from '@libs/database/postgres/common';
import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Op, Sequelize, WhereOptions } from 'sequelize';
import { TagModel } from '../../../../database/models/tag.model';
import { TagEntity } from '../../domain/model/tag';
import {
  FindAllTagsProps,
  FindOneTagProps,
  GetPaginationTagProps,
  ITagRepository,
} from '../../domain/repositoty-interface';
import { TagMapper } from '../mapper/tag.mapper';
import { LibPostTagRepository, LibTagRepository } from '@libs/database/postgres/repository';

@Injectable()
export class TagRepository implements ITagRepository {
  private _logger = new Logger(TagRepository.name);

  public constructor(
    @InjectConnection() private readonly _sequelizeConnection: Sequelize,
    private readonly _libPostTagRepo: LibPostTagRepository,
    private readonly _libTagRepo: LibTagRepository,
    private readonly _tagMapper: TagMapper
  ) {}

  public async getPagination(input: GetPaginationTagProps): Promise<PaginationResult<TagEntity>> {
    const { offset, limit, name, groupIds } = input;
    const conditions: WhereOptions<TagModel> = {};
    if (groupIds && groupIds.length) {
      conditions.groupId = groupIds;
    }
    if (name) {
      conditions.name = { [Op.iLike]: name + '%' };
    }
    const { rows, count } = await this._libTagRepo.findAndCountAll({
      select: ['id', 'name', 'slug', 'groupId', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy'],
      //selectRaw: [this._libTagRepo.loadTotalUsed()],
      where: conditions,
      offset,
      limit,
      order: [
        ['totalUsed', 'DESC'],
        ['createdAt', 'DESC'],
      ],
    });
    const result = rows.map((row) => this._tagMapper.toDomain(row));
    return {
      rows: result,
      total: count,
    };
  }

  public async create(entity: TagEntity): Promise<void> {
    await this._libTagRepo.create(this._tagMapper.toPersistence(entity));
  }

  public async update(entity: TagEntity): Promise<void> {
    await this._libTagRepo.update(this._tagMapper.toPersistence(entity), {
      where: { id: entity.get('id') },
    });
  }

  public async delete(id: string): Promise<void> {
    const transaction = await this._sequelizeConnection.transaction();
    try {
      await this._libPostTagRepo.delete({ where: { tagId: id }, transaction });
      await this._libTagRepo.delete({ where: { id: id }, transaction });
      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      this._logger.error(JSON.stringify(e?.stack));
      throw e;
    }
  }

  public async findOne(input: FindOneTagProps): Promise<TagEntity> {
    const conditions: WhereOptions<TagModel> = {};
    if (input.id) {
      conditions.id = input.id;
    }
    if (input.name) {
      conditions.name = input.name;
    }
    if (input.groupId) {
      conditions.groupId = input.groupId;
    }
    const entity = await this._libTagRepo.first({
      select: ['id', 'name', 'slug', 'groupId', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy'],
      //selectRaw: [this._libTagRepo.loadTotalUsed()],
      where: conditions,
    });
    return this._tagMapper.toDomain(entity);
  }

  public async findAll(input: FindAllTagsProps): Promise<TagEntity[]> {
    const tags = await this._libTagRepo.findMany({
      where: input,
    });
    return tags.map((tag) => this._tagMapper.toDomain(tag));
  }
}
