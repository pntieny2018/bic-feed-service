import { ReportContentModel } from '@libs/database/postgres/model';
import { BaseRepository } from '@libs/database/postgres/repository';

export class LibUserReportContentRepository extends BaseRepository<ReportContentModel> {
  public constructor() {
    super(ReportContentModel);
  }
}
