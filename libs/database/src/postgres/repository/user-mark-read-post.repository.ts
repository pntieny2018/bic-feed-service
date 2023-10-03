import { BaseRepository } from '@libs/database/postgres/repository/base.repository';
import { UserMarkReadPostModel } from '@libs/database/postgres/model/user-mark-read-post.model';

export class LibUserMarkReadPostRepository extends BaseRepository<UserMarkReadPostModel> {
  public constructor() {
    super(UserMarkReadPostModel);
  }
}
