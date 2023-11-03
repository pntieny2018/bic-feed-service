import { UserMarkReadPostModel } from '@libs/database/postgres/model';
import { BaseRepository } from '@libs/database/postgres/repository';

export class LibUserMarkReadPostRepository extends BaseRepository<UserMarkReadPostModel> {
  public constructor() {
    super(UserMarkReadPostModel);
  }
}
