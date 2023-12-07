import { LibCategoryRepository } from '@libs/database/postgres/repository/category.repository';

import { FindCategoriesPaginationHandler } from '../application/query/category';
import { CategoryDomainService } from '../domain/domain-service/category.domain-service';
import { CATEGORY_DOMAIN_SERVICE_TOKEN } from '../domain/domain-service/interface';
import { CATEGORY_REPOSITORY_TOKEN } from '../domain/repositoty-interface';
import { CategoryValidator } from '../domain/validator/category.validator';
import { CATEGORY_VALIDATOR_TOKEN } from '../domain/validator/interface';
import { CategoryMapper } from '../driven-adapter/mapper/category.mapper';
import { CategoryRepository } from '../driven-adapter/repository';

export const categoryProvider = [
  {
    provide: CATEGORY_VALIDATOR_TOKEN,
    useClass: CategoryValidator,
  },
  {
    provide: CATEGORY_REPOSITORY_TOKEN,
    useClass: CategoryRepository,
  },
  {
    provide: CATEGORY_DOMAIN_SERVICE_TOKEN,
    useClass: CategoryDomainService,
  },
  LibCategoryRepository,
  CategoryMapper,

  FindCategoriesPaginationHandler,
];
