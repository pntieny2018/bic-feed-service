import { UserSeenPostModel } from '@libs/database/postgres/model';
import { BaseRepository } from '@libs/database/postgres/repository';

export class LibUserSeenPostRepository extends BaseRepository<UserSeenPostModel> {
  public constructor() {
    super(UserSeenPostModel);
  }
}
