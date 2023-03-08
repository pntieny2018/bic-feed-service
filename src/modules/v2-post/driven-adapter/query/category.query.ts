import { ICategoryQuery } from '../../domain/query-interface/category.query.interface';
import { PaginationResult } from '../../../../common/types/pagination-result.type';
import { CategoryEntity } from '../../domain/model/category';

export class CategoryQuery implements ICategoryQuery {
  public async getPagination(): Promise<PaginationResult<CategoryEntity>> {
    return {
      rows: [],
      total: 0,
    };
  }
}
