import { UserSavePostModel } from '@libs/database/postgres/model';
import { BaseRepository } from '@libs/database/postgres/repository';

export class LibUserSavePostRepository extends BaseRepository<UserSavePostModel> {
  public constructor() {
    super(UserSavePostModel);
  }
}
