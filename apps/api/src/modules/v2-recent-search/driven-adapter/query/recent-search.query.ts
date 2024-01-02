import { PaginationResult } from '@libs/database/postgres/common';
import { RecentSearchModel } from '@libs/database/postgres/model';
import { Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';

import { RecentSearchType } from '../../data-type';
import {
  IRecentSearchFactory,
  RECENT_SEARCH_FACTORY_TOKEN,
} from '../../domain/factory/interface/recent-search.factory.interface';
import { RecentSearchEntity } from '../../domain/model/recent-search/recent-search.entity';

import {
  GetPaginationRecentSearchProps,
  IRecentSearchQuery,
} from './interface/recent-search.query.interface';

export class RecentSearchQuery implements IRecentSearchQuery {
  @Inject(RECENT_SEARCH_FACTORY_TOKEN) private readonly _factory: IRecentSearchFactory;
  @InjectModel(RecentSearchModel) private readonly _recentSearchModel: typeof RecentSearchModel;

  public async getPagination(
    input: GetPaginationRecentSearchProps
  ): Promise<PaginationResult<RecentSearchEntity>> {
    const { offset, limit, keyword, target, userId, order } = input;
    const conditions = { createdBy: userId };
    if (keyword) {
      conditions['keyword'] = { [Op.iLike]: keyword + '%' };
    }
    if (target && target !== RecentSearchType.ALL) {
      conditions['target'] = target;
    }
    const { rows, count } = await this._recentSearchModel.findAndCountAll({
      where: conditions,
      offset,
      limit,
      order: [['updatedAt', order]],
    });

    const result = rows.map((row) => this._factory.reconstitute(row));
    return {
      rows: result,
      total: count,
    };
  }
}
