import { CategoryModel } from '@libs/database/postgres/model';
import { BaseRepository } from '@libs/database/postgres/repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LibCategoryRepository extends BaseRepository<CategoryModel> {
  public constructor() {
    super(CategoryModel);
  }
}
