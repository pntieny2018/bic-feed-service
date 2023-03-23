import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindRecentSearchesPaginationQuery } from './find-recent-searches-pagination.query';
import { FindRecentSearchesPaginationDto } from './find-recent-searches-pagination.dto';
import { Inject } from '@nestjs/common';
import {
  IRecentSearchQuery,
  RECENT_SEARCH_QUERY_TOKEN,
} from '../../../domain/query-interface/recent-search.query.interface';

@QueryHandler(FindRecentSearchesPaginationQuery)
export class FindRecentSearchesPaginationHandler
  implements IQueryHandler<FindRecentSearchesPaginationQuery, FindRecentSearchesPaginationDto>
{
  @Inject(RECENT_SEARCH_QUERY_TOKEN) private readonly _recentSearchQuery: IRecentSearchQuery;
  public async execute(
    query: FindRecentSearchesPaginationQuery
  ): Promise<FindRecentSearchesPaginationDto> {
    const { rows, total } = await this._recentSearchQuery.getPagination(query.payload);

    return {
      rows: rows.map((row) => ({
        id: row.get('id'),
        createdBy: row.get('createdBy'),
        updatedBy: row.get('updatedBy'),
        target: row.get('target'),
        keyword: row.get('keyword'),
        totalSearched: row.get('totalSearched'),
        createdAt: row.get('createdAt'),
        updatedAt: row.get('updatedAt'),
      })),
      total: total,
    };
  }
}
