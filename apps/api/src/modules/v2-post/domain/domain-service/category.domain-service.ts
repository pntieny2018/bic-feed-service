import { PaginationResult } from '@libs/database/postgres/common';
import { Inject } from '@nestjs/common';

import { CategoryEntity } from '../model/category';
import { CATEGORY_REPOSITORY_TOKEN, ICategoryRepository } from '../repositoty-interface';

import { GetPaginationCategoryProps, ICategoryDomainService } from './interface';

export class CategoryDomainService implements ICategoryDomainService {
  public constructor(
    @Inject(CATEGORY_REPOSITORY_TOKEN) private readonly _categoryRepository: ICategoryRepository
  ) {}

  public async getPagination(
    props: GetPaginationCategoryProps
  ): Promise<PaginationResult<CategoryEntity>> {
    return this._categoryRepository.getPagination(props);
  }
}
