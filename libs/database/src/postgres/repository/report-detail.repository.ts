import { ReportDetailModel } from '@libs/database/postgres/model';
import { BaseRepository } from '@libs/database/postgres/repository';

export class LibReportDetailRepository extends BaseRepository<ReportDetailModel> {
  public constructor() {
    super(ReportDetailModel);
  }
}
