import { LibCategoryRepository } from '@libs/database/postgres/repository/category.repository';
import { LIB_CATEGORY_REPOSITORY_TOKEN } from '@libs/database/postgres/repository/interface';

import { FindCategoriesPaginationHandler } from '../application/query/category';
import { CategoryDomainService } from '../domain/domain-service/category.domain-service';
import { CATEGORY_DOMAIN_SERVICE_TOKEN } from '../domain/domain-service/interface';
import { CategoryFactory } from '../domain/factory';
import { CATEGORY_FACTORY_TOKEN } from '../domain/factory/interface';
import { CATEGORY_REPOSITORY_TOKEN } from '../domain/repositoty-interface';
import { CategoryValidator } from '../domain/validator/category.validator';
import { CATEGORY_VALIDATOR_TOKEN } from '../domain/validator/interface';
import { CategoryMapper } from '../driven-adapter/mapper/category.mapper';
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
  {
    provide: CATEGORY_DOMAIN_SERVICE_TOKEN,
    useClass: CategoryDomainService,
  },
  {
    provide: LIB_CATEGORY_REPOSITORY_TOKEN,
    useClass: LibCategoryRepository,
  },
  CategoryMapper,

  FindCategoriesPaginationHandler,
];
