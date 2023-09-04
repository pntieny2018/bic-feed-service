import { CategoryEntity } from '../model/category';

export type FindCategoryProps = {
  where: {
    id?: string;
    ids?: string[];
    createdBy?: string;
    shouldDisjunctionLevel?: boolean;
  };
};

export interface ICategoryRepository {
  count(whereOptions: FindCategoryProps): Promise<number>;

  findAll(input: FindCategoryProps): Promise<CategoryEntity[]>;
}

export const CATEGORY_REPOSITORY_TOKEN = 'CATEGORY_REPOSITORY_TOKEN';
