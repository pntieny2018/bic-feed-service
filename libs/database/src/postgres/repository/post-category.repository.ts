import { PostCategoryModel } from '@libs/database/postgres/model';
import { BaseRepository } from '@libs/database/postgres/repository/base.repository';

export class LibPostCategoryRepository extends BaseRepository<PostCategoryModel> {
  public constructor() {
    super(PostCategoryModel);
  }
}
