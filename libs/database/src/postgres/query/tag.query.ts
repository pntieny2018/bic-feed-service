import { getDatabaseConfig, PaginationResult } from '@app/database/postgres/common';
import { PostTagModel } from '@app/database/postgres/model/post-tag.model';
import { PostModel } from '@app/database/postgres/model/post.model';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Literal } from 'sequelize/types/utils';
import { Sequelize } from 'sequelize-typescript';

import { TagModel } from '../model/tag.model';

import { GetPaginationTagProps, ILibTagQuery } from './interface';

export class LibTagQuery implements ILibTagQuery {
  public constructor(
    @InjectModel(TagModel)
    private readonly _tagModel: typeof TagModel
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
