import { CategoryEntity, CategoryProps } from '../model/category';

export interface ICategoryFactory {
  reconstitute(props: CategoryProps): CategoryEntity;
}

export const CATEGORY_FACTORY_TOKEN = 'CATEGORY_FACTORY_TOKEN';
