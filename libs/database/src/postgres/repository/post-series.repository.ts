import { BaseRepository } from '@libs/database/postgres/repository/base.repository';
import { PostSeriesModel } from '@libs/database/postgres/model/post-series.model';

export class LibPostSeriesRepository extends BaseRepository<PostSeriesModel> {
  public constructor() {
    super(PostSeriesModel);
  }
}
