import { PostGroupModel } from '@libs/database/postgres/model/post-group.model';
import { BaseRepository } from '@libs/database/postgres/repository/base.repository';

export class LibPostGroupRepository extends BaseRepository<PostGroupModel> {
  public constructor() {
    super(PostGroupModel);
  }
}
