import { CategoryEntity } from '../model/category';

export type FindCategoryOptions = {
  where: {
    id?: string;
    ids?: string[];
    createdBy?: string;
    shouldDisjunctionLevel?: boolean;
  };
};

export interface ICategoryRepository {
  count(whereOptions: FindCategoryOptions): Promise<number>;

  findAll(input: FindCategoryOptions): Promise<CategoryEntity[]>;
}

export const CATEGORY_REPOSITORY_TOKEN = 'CATEGORY_REPOSITORY_TOKEN';
