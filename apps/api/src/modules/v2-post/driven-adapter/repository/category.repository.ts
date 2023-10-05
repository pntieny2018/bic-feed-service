import { PaginationResult } from '@libs/database/postgres/common';
import {
  ILibCategoryRepository,
  LIB_CATEGORY_REPOSITORY_TOKEN,
} from '@libs/database/postgres/repository/interface';
import { Inject, Injectable } from '@nestjs/common';

import { CategoryEntity } from '../../domain/model/category';
import {
  FindCategoryProps,
  GetPaginationCategoryProps,
  ICategoryRepository,
} from '../../domain/repositoty-interface';
import { CategoryMapper } from '../mapper/category.mapper';

@Injectable()
export class CategoryRepository implements ICategoryRepository {
  public constructor(
    @Inject(LIB_CATEGORY_REPOSITORY_TOKEN)
    private readonly _libCategoryRepository: ILibCategoryRepository,
    private readonly _categoryMapper: CategoryMapper
  ) {}

  public async getPagination(
    input: GetPaginationCategoryProps
  ): Promise<PaginationResult<CategoryEntity>> {
    const { rows, total } = await this._libCategoryRepository.getPagination(input);
    return {
      rows: rows.map((row) => this._categoryMapper.toDomain(row)),
      total,
    };
  }

  public async count(options: FindCategoryProps): Promise<number> {
    return this._libCategoryRepository.count(options);
  }

  public async findAll(options: FindCategoryProps): Promise<CategoryEntity[]> {
    const categories = await this._libCategoryRepository.findAll(options);
    return categories.map((category) => this._categoryMapper.toDomain(category));
  }
}
