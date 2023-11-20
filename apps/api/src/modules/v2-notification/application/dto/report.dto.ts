import { CONTENT_REPORT_REASON_TYPE, CONTENT_TARGET } from '@beincom/constants';
import { REPORT_SCOPE, REPORT_STATUS } from '@libs/database/postgres/model';

import { ActorObjectDto } from './user.dto';

export class ReportObjectDto {
  public id: string;
  public targetId: string;
  public targetType: CONTENT_TARGET;
  public status: REPORT_STATUS;
  public details: ReportDetailObjectDto[];
  public actorsReported: ActorObjectDto[];

  public constructor(data: ReportObjectDto) {
    this.id = data.id;
    this.targetId = data.targetId;
    this.targetType = data.targetType;
    this.status = data.status;
    this.details = data.details.map((detail) => new ReportDetailObjectDto(detail));
    this.actorsReported = data.actorsReported.map((actor) => new ActorObjectDto(actor));
  }
}

export class ReportDetailObjectDto {
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

  public constructor(data: ReportDetailObjectDto) {
    this.id = data.id;
    this.reportId = data.reportId;
    this.targetId = data.targetId;
    this.targetType = data.targetType;
    this.groupId = data.groupId;
    this.createdBy = data.createdBy;
    this.reportTo = data.reportTo;
    this.reasonType = data.reasonType;
    this.reason = data.reason;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}

export class ReportActivityObjectDto {
  public id: string;
  public actor: ActorObjectDto;
  public report: ReportObjectDto;
  public createdAt: Date;
  public updatedAt: Date;

  public constructor(data: ReportActivityObjectDto) {
    this.id = data.id;
    this.actor = new ActorObjectDto(data.actor);
    this.report = new ReportObjectDto(data.report);
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
