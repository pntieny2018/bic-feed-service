import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  CATEGORY_REPOSITORY_TOKEN,
  ICategoryRepository,
} from '../../../../domain/repositoty-interface';
import { FindCategoriesPaginationDto } from '../../../dto/category.dto';

import { FindCategoriesPaginationQuery } from './find-categories-pagination.query';

@QueryHandler(FindCategoriesPaginationQuery)
export class FindCategoriesPaginationHandler
  implements IQueryHandler<FindCategoriesPaginationQuery, FindCategoriesPaginationDto>
{
  public constructor(
    @Inject(CATEGORY_REPOSITORY_TOKEN)
    private readonly _categoryRepository: ICategoryRepository
  ) {}

  public async execute(query: FindCategoriesPaginationQuery): Promise<FindCategoriesPaginationDto> {
    const { rows, total } = await this._categoryRepository.getPagination(query.payload);

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
