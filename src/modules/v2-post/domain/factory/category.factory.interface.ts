import { CategoryEntity, CategoryProps } from '../model/category';

export interface ICategoryFactory {
  reconstitute(props: CategoryProps): CategoryEntity;
}
