import { BaseRepository } from '@libs/database/postgres/repository/base.repository';
import { PostCategoryModel } from '@libs/database/postgres/model/post-category.model';

export class LibPostCategoryRepository extends BaseRepository<PostCategoryModel> {
  public constructor() {
    super(PostCategoryModel);
  }
}
