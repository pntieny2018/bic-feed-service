import { BaseRepository } from '@libs/database/postgres/repository/base.repository';
import { UserSeenPostModel } from '@libs/database/postgres/model/user-seen-post.model';

export class LibUserSeenPostRepository extends BaseRepository<UserSeenPostModel> {
  public constructor() {
    super(UserSeenPostModel);
  }
}
