import { PaginationProps, PaginationResult } from '@libs/database/postgres/common';

import { CategoryModel } from '../../model/category.model';

export type GetPaginationCategoryProps = PaginationProps & {
  name?: string;
  level?: number;
  createdBy?: string;
};

export type FindCategoryOptions = {
  where: {
    id?: string;
    ids?: string[];
    createdBy?: string;
    shouldDisjunctionLevel?: boolean;
  };
};

export interface ILibCategoryQuery {
  getPagination(input: GetPaginationCategoryProps): Promise<PaginationResult<CategoryModel>>;
  count(whereOptions: FindCategoryOptions): Promise<number>;
  findAll(input: FindCategoryOptions): Promise<CategoryModel[]>;
}

export const LIB_CATEGORY_QUERY_TOKEN = 'LIB_CATEGORY_QUERY_TOKEN';
