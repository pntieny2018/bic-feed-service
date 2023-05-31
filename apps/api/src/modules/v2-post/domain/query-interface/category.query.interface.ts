import { PaginationResult } from '../../../../common/types/pagination-result.type';
import { PaginationProps } from '../../../../common/types/pagination-props.type';
import { CategoryEntity } from '../model/category';

export type GetPaginationCategoryProps = PaginationProps & {
  name?: string;
  level?: number;
  createdBy?: string;
};

export interface ICategoryQuery {
  getPagination(input: GetPaginationCategoryProps): Promise<PaginationResult<CategoryEntity>>;
}

export const CATEGORY_QUERY_TOKEN = 'CATEGORY_QUERY_TOKEN';
