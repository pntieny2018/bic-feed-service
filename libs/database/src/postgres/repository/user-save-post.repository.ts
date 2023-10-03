import { BaseRepository } from '@libs/database/postgres/repository/base.repository';
import { UserSavePostModel } from '@libs/database/postgres/model/user-save-post.model';

export class LibUserSavePostRepository extends BaseRepository<UserSavePostModel> {
  public constructor() {
    super(UserSavePostModel);
  }
}
