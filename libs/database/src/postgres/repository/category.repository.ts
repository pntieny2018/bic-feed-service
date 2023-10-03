import { CategoryModel } from '@libs/database/postgres/model/category.model';
import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@libs/database/postgres/repository/base.repository';

@Injectable()
export class LibCategoryRepository extends BaseRepository<CategoryModel> {
  public constructor() {
    super(CategoryModel);
  }
}
