import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import {
  CATEGORY_QUERY_TOKEN,
  ICategoryQuery,
} from '../../../domain/query-interface/category.query.interface';
import { FindCategoriesPaginationQuery } from './find-categories-pagination.query';
import { FindCategoriesPaginationDto } from '../../dto/category.dto';

@QueryHandler(FindCategoriesPaginationQuery)
export class FindCategoriesPaginationHandler
  implements IQueryHandler<FindCategoriesPaginationQuery, FindCategoriesPaginationDto>
{
  public constructor(
    @Inject(CATEGORY_QUERY_TOKEN) private readonly _categoryQuery: ICategoryQuery
  ) {}

  public async execute(query: FindCategoriesPaginationQuery): Promise<FindCategoriesPaginationDto> {
    const { rows, total } = await this._categoryQuery.getPagination(query.payload);

    return {
      rows: rows.map((row) => ({
        id: row.get('id'),
        name: row.get('name'),
        parentId: row.get('parentId'),
        active: row.get('isActive'),
        slug: row.get('slug'),
        level: row.get('level'),
        createdBy: row.get('createdBy'),
        createdAt: row.get('createdAt'),
        updatedAt: row.get('updatedAt'),
      })),
      total: total,
    };
  }
}
