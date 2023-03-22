import { CategoryQuery } from '../driven-adapter/query';
import { CategoryFactory } from '../domain/factory/category/category.factory';
import { FindCategoriesPaginationHandler } from '../application/query/find-categories/find-categories-pagination.handler';

export const categoryProvider = [
  {
    provide: 'CATEGORY_QUERY_TOKEN',
    useClass: CategoryQuery,
  },
  {
    provide: 'CATEGORY_FACTORY_TOKEN',
    useClass: CategoryFactory,
  },
  FindCategoriesPaginationHandler,
];
