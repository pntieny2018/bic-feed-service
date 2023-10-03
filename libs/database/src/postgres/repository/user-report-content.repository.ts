import { ReportContentDetailModel } from '@libs/database/postgres/model';
import { BaseRepository } from '@libs/database/postgres/repository';

export class LibUserReportContentRepository extends BaseRepository<ReportContentDetailModel> {
  public constructor() {
    super(ReportContentDetailModel);
  }
}
