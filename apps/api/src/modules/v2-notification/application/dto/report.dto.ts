import { CONTENT_TARGET } from '@beincom/constants';

import { ActorObjectDto } from './user.dto';

export class ReportObjectDto {
  public id: string;
  public targetId: string;
  public targetType: CONTENT_TARGET;
  public details: ReportDetailObjectDto[];
  public reporterIds?: string[]; // for report hidden

  public constructor(data: ReportObjectDto) {
    this.id = data.id;
    this.targetId = data.targetId;
    this.targetType = data.targetType;
    this.details = data.details.map((detail) => new ReportDetailObjectDto(detail));
    this.reporterIds = data.reporterIds;
  }
}

export class ReportDetailObjectDto {
  public targetId: string;
  public groupId: string;

  public constructor(data: ReportDetailObjectDto) {
    this.targetId = data.targetId;
    this.groupId = data.groupId;
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
