import { PaginationProps } from '@libs/database/postgres/common';

import { PaginationResult } from '../../../../common/types';
import { CategoryEntity } from '../model/category';

export type FindCategoryProps = {
  where: {
    id?: string;
    ids?: string[];
    createdBy?: string;
    shouldDisjunctionLevel?: boolean;
  };
};

export type GetPaginationCategoryProps = PaginationProps & {
  name?: string;
  level?: number;
  createdBy?: string;
};

export interface ICategoryRepository {
  getPagination(input: GetPaginationCategoryProps): Promise<PaginationResult<CategoryEntity>>;

  count(whereOptions: FindCategoryProps): Promise<number>;

  findAll(input: FindCategoryProps): Promise<CategoryEntity[]>;
}

export const CATEGORY_REPOSITORY_TOKEN = 'CATEGORY_REPOSITORY_TOKEN';
