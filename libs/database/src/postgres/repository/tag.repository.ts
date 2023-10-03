import { getDatabaseConfig, PaginationResult } from '@libs/database/postgres/common';
import { PostTagModel, PostModel, TagAttributes, TagModel } from '@libs/database/postgres/model';
import {
  FindAllTagsProps,
  FindOneTagProps,
  GetPaginationTagProps,
  ILibTagRepository,
} from '@libs/database/postgres/repository/interface';
import { Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { FindOptions, Op, Sequelize } from 'sequelize';
import { Literal } from 'sequelize/types/utils';

export class LibTagRepository implements ILibTagRepository {
  private _logger = new Logger(LibTagRepository.name);

  public constructor(
    @InjectModel(TagModel)
    private readonly _tagModel: typeof TagModel,
    @InjectModel(PostTagModel)
    private readonly _postTagModel: typeof PostTagModel,
    @InjectConnection() private readonly _sequelizeConnection: Sequelize
  ) {}

  public async getPagination(input: GetPaginationTagProps): Promise<PaginationResult<TagModel>> {
    const { offset, limit, name, groupIds } = input;
    const conditions = {};
    if (groupIds && groupIds.length) {
      conditions['groupId'] = groupIds;
    }
    if (name) {
      conditions['name'] = { [Op.iLike]: name + '%' };
    }
    const { rows, count } = await this._tagModel.findAndCountAll({
      attributes: this._loadAllAttributes(),
      where: conditions,
      offset,
      limit,
      order: [
        ['totalUsed', 'DESC'],
        ['createdAt', 'DESC'],
      ],
    });
    return {
      rows,
      total: count,
    };
  }

  public async create(data: TagAttributes): Promise<void> {
    await this._tagModel.create(data);
  }

  public async update(tagId: string, tag: Partial<TagAttributes>): Promise<void> {
    await this._tagModel.update(tag, {
      where: { id: tagId },
    });
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

  public async findOne(input: FindOneTagProps): Promise<TagModel> {
    const findOptions: FindOptions = {
      attributes: this._loadAllAttributes(),
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
    return this._tagModel.findOne(findOptions);
  }

  public async findAll(input: FindAllTagsProps): Promise<TagModel[]> {
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
    return this._tagModel.findAll({
      where: condition,
    });
  }

  private _loadTotalUsed(): [Literal, string] {
    const { schema } = getDatabaseConfig();

    return [
      Sequelize.literal(`CAST((
            SELECT COUNT(*)
            FROM ${schema}.${PostModel.tableName} p
            JOIN ${schema}.${PostTagModel.tableName} pt ON pt.post_id = p.id
            WHERE pt.tag_id = "TagModel".id AND p.is_hidden = false AND p.status = 'PUBLISHED'
          ) AS INTEGER)`),
      'totalUsed',
    ];
  }

  private _loadAllAttributes(): Array<string | [Literal, string]> {
    return [
      'id',
      'name',
      'slug',
      'groupId',
      'createdAt',
      'updatedAt',
      'createdBy',
      'updatedBy',
      this._loadTotalUsed(),
    ];
  }
}
