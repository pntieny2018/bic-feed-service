import { PostTagModel } from '@libs/database/postgres/model';
import { BaseRepository } from '@libs/database/postgres/repository';

export class LibPostTagRepository extends BaseRepository<PostTagModel> {
  public constructor() {
    super(PostTagModel);
  }
}
