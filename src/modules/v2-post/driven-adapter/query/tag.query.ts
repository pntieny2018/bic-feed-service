import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { PaginationResult } from '../../../../common/types/pagination-result.type';
import { TagModel } from '../../../../database/models/tag.model';
import { TagEntity } from '../../domain/model/tag/tag.model';
import { GetPaginationTagProps, ITagQuery } from '../../domain/query-interface';

export class TagQuery implements ITagQuery {
  private _logger = new Logger(TagQuery.name);
  @InjectModel(TagModel)
  private readonly _tagModel: typeof TagModel;

  public async getPagination(input: GetPaginationTagProps): Promise<PaginationResult<TagEntity>> {
    const { offset, limit, name, groupIds } = input;
    const conditions = {};
    if (groupIds && groupIds.length) {
      conditions['groupId'] = groupIds.map((groupId) => groupId.value);
    }
    if (name) {
      conditions['name'] = { [Op.iLike]: '%' + name };
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

    const result = rows.map((row) => TagEntity.fromJson(row));
    return {
      rows: result,
      total: count,
    };
  }
}
