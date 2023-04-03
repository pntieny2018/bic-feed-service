import { CategoryEntity, CategoryProps } from '../model/category';
import { ICategoryFactory } from './category.factory.interface';

export class CategoryFactory implements ICategoryFactory {
  public reconstitute(properties: CategoryProps): CategoryEntity {
    return new CategoryEntity(properties);
  }
}
