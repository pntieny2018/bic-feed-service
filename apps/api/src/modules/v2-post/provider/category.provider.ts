import { CategoryQuery } from '../driven-adapter/query';
import { CategoryFactory } from '../domain/factory/category.factory';
import { FindCategoriesPaginationHandler } from '../application/query/find-categories/find-categories-pagination.handler';
import { CATEGORY_FACTORY_TOKEN } from '../domain/factory/interface';
import { CATEGORY_QUERY_TOKEN } from '../domain/query-interface';
import { CATEGORY_VALIDATOR_TOKEN } from '../domain/validator/interface';
import { CategoryValidator } from '../domain/validator/category.validator';
import { CATEGORY_REPOSITORY_TOKEN } from '../domain/repositoty-interface';
import { CategoryRepository } from '../driven-adapter/repository/category.repository';

export const categoryProvider = [
  {
    provide: CATEGORY_QUERY_TOKEN,
    useClass: CategoryQuery,
  },
  {
    provide: CATEGORY_FACTORY_TOKEN,
    useClass: CategoryFactory,
  },
  {
    provide: CATEGORY_VALIDATOR_TOKEN,
    useClass: CategoryValidator,
  },
  {
    provide: CATEGORY_REPOSITORY_TOKEN,
    useClass: CategoryRepository,
  },
  FindCategoriesPaginationHandler,
];
