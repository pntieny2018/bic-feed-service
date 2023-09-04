import { PaginationProps } from '../../../../../common/types/pagination-props.type';
import { PaginationResult } from '../../../../../common/types/pagination-result.type';
import { CategoryEntity } from '../../model/category';

export type GetPaginationCategoryProps = PaginationProps & {
  name?: string;
  level?: number;
  createdBy?: string;
};

export interface ICategoryDomainService {
  getPagination(props: GetPaginationCategoryProps): Promise<PaginationResult<CategoryEntity>>;
}

export const CATEGORY_DOMAIN_SERVICE_TOKEN = 'CATEGORY_DOMAIN_SERVICE_TOKEN';
