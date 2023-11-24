import { ReportContentDetailModel } from '@libs/database/postgres/model';
import { BaseRepository } from '@libs/database/postgres/repository';

export class LibUserReportContentDetailRepository extends BaseRepository<ReportContentDetailModel> {
  public constructor() {
    super(ReportContentDetailModel);
  }
}
