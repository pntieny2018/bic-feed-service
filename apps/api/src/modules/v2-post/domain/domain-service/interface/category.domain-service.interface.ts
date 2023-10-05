import { PaginationProps, PaginationResult } from '@libs/database/postgres/common';

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
