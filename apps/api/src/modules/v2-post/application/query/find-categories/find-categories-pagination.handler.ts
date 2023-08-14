import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  CATEGORY_DOMAIN_SERVICE_TOKEN,
  ICategoryDomainService,
} from '../../../domain/domain-service/interface';
import { FindCategoriesPaginationDto } from '../../dto/category.dto';

import { FindCategoriesPaginationQuery } from './find-categories-pagination.query';

@QueryHandler(FindCategoriesPaginationQuery)
export class FindCategoriesPaginationHandler
  implements IQueryHandler<FindCategoriesPaginationQuery, FindCategoriesPaginationDto>
{
  public constructor(
    @Inject(CATEGORY_DOMAIN_SERVICE_TOKEN)
    private readonly _categoryDomainService: ICategoryDomainService
  ) {}

  public async execute(query: FindCategoriesPaginationQuery): Promise<FindCategoriesPaginationDto> {
    const { rows, total } = await this._categoryDomainService.getPagination(query.payload);

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
