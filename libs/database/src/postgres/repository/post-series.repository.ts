import { PostSeriesModel } from '@libs/database/postgres/model';
import { BaseRepository } from '@libs/database/postgres/repository/base.repository';

export class LibPostSeriesRepository extends BaseRepository<PostSeriesModel> {
  public constructor() {
    super(PostSeriesModel);
  }
}
