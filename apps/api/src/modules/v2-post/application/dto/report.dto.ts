import { CONTENT_REPORT_REASON_TYPE, CONTENT_TARGET } from '@beincom/constants';
import { IPaginatedInfo, PaginatedResponse } from '@libs/database/postgres/common';
import { REPORT_SCOPE, REPORT_STATUS } from '@libs/database/postgres/model';

export class ReportDto {
  public id: string;
  public targetId: string;
  public targetType: CONTENT_TARGET;
  public targetActorId: string;
  public status: REPORT_STATUS;
  public updatedBy?: string;
  public createdAt?: Date;
  public updatedAt?: Date;
  public details?: ReportDetailDto[];
  public contentReportDetail?: ContentReportDetail;
  public targetAuthor?: TargetAuthor;

  public constructor(data: Partial<ReportDto>) {
    Object.assign(this, data);
  }
}

export class ReportDetailDto {
  public id: string;
  public reportId: string;
  public targetId: string;
  public targetType: CONTENT_TARGET;
  public groupId: string;
  public createdBy: string;
  public reportTo: REPORT_SCOPE;
  public reasonType: CONTENT_REPORT_REASON_TYPE;
  public reason?: string;
  public createdAt?: Date;
  public updatedAt?: Date;

  public constructor(data: Partial<ReportDetailDto>) {
    Object.assign(this, data);
  }
}

export class TargetAuthor {
  public id: string;
  public avatar: string;
  public username: string;
  public fullname: string;

  public constructor(data: TargetAuthor) {
    Object.assign(this, data);
  }
}

export class ContentReportDetail {
  public content: string;

  public constructor(data: ContentReportDetail) {
    Object.assign(this, data);
  }
}

export class GetListReportsPaginationDto extends PaginatedResponse<ReportDto> {
  public constructor(list: ReportDto[], meta?: IPaginatedInfo) {
    super(list, meta);
  }
}
