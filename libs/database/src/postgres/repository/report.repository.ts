import { ReportModel } from '@libs/database/postgres/model';
import { BaseRepository } from '@libs/database/postgres/repository';

export class LibReportRepository extends BaseRepository<ReportModel> {
  public constructor() {
    super(ReportModel);
  }
}
