import { BaseRepository } from '@libs/database/postgres/repository/base.repository';
import { PostTagModel } from '@libs/database/postgres/model/post-tag.model';

export class LibPostTagRepository extends BaseRepository<PostTagModel> {
  public constructor() {
    super(PostTagModel);
  }
}
