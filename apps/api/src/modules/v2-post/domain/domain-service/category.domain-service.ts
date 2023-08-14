import { Inject } from '@nestjs/common';

import { PaginationResult } from '../../../../common/types/pagination-result.type';
import { CategoryEntity } from '../model/category';
import { CATEGORY_QUERY_TOKEN, ICategoryQuery } from '../query-interface';

import { GetPaginationCategoryProps, ICategoryDomainService } from './interface';

export class CategoryDomainService implements ICategoryDomainService {
  public constructor(
    @Inject(CATEGORY_QUERY_TOKEN) private readonly _categoryQuery: ICategoryQuery
  ) {}

  public async getPagination(
    props: GetPaginationCategoryProps
  ): Promise<PaginationResult<CategoryEntity>> {
    return this._categoryQuery.getPagination(props);
  }
}
