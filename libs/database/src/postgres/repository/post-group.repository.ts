import { PostGroupModel } from '@libs/database/postgres/model';
import { BaseRepository } from '@libs/database/postgres/repository';

export class LibPostGroupRepository extends BaseRepository<PostGroupModel> {
  public constructor() {
    super(PostGroupModel);
  }
}
