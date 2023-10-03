import { BaseRepository } from '@libs/database/postgres/repository/base.repository';
import { ReportContentDetailModel } from '@libs/database/postgres/model/report-content-detail.model';

export class LibUserReportContentRepository extends BaseRepository<ReportContentDetailModel> {
  public constructor() {
    super(ReportContentDetailModel);
  }
}
