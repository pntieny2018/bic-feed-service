import { PaginationProps, PaginationResult } from '@libs/database/postgres/common';
import { CategoryModel } from '@libs/database/postgres/model/category.model';

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

export interface ILibCategoryRepository {
  getPagination(input: GetPaginationCategoryProps): Promise<PaginationResult<CategoryModel>>;
  count(whereOptions: FindCategoryOptions): Promise<number>;
  findAll(input: FindCategoryOptions): Promise<CategoryModel[]>;
}

export const LIB_CATEGORY_REPOSITORY_TOKEN = 'LIB_CATEGORY_REPOSITORY_TOKEN';
