import { LibCategoryRepository } from '@libs/database/postgres/repository/category.repository';

import { FindCategoriesPaginationHandler } from '../application/query/category';
import { CategoryFactory } from '../domain/factory';
import { CATEGORY_FACTORY_TOKEN } from '../domain/factory/interface';
import { CATEGORY_REPOSITORY_TOKEN } from '../domain/repositoty-interface';
import { CategoryValidator } from '../domain/validator/category.validator';
import { CATEGORY_VALIDATOR_TOKEN } from '../domain/validator/interface';
import { CategoryMapper } from '../driven-adapter/mapper';
import { CategoryRepository } from '../driven-adapter/repository';

export const categoryProvider = [
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
  LibCategoryRepository,
  CategoryMapper,

  FindCategoriesPaginationHandler,
];
