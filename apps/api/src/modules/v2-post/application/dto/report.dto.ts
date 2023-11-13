import {
  CONTENT_REPORT_REASON_DESCRIPTION,
  CONTENT_REPORT_REASON_TYPE,
  CONTENT_TARGET,
} from '@beincom/constants';
import { IPaginatedInfo, PaginatedResponse } from '@libs/database/postgres/common';
import { REPORT_SCOPE, REPORT_STATUS } from '@libs/database/postgres/model';

import { ArticleDto } from './article.dto';
import { CommentBaseDto } from './comment.dto';
import { PostDto } from './post.dto';

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

  public constructor(data: Partial<ReportDto>) {
    Object.assign(this, data);
  }
}

export class ReportContentForAdminDto {
  public id: string;
  public targetId: string;
  public targetType: CONTENT_TARGET;
  public targetActorId: string;
  public status: REPORT_STATUS;
  public updatedBy?: string;
  public createdAt?: Date;
  public updatedAt?: Date;
  public details?: ReportDetailDto[];
  public contentReportDetail?: ContentReportDetailDto;
  public targetActor?: TargetActorDto;

  public constructor(data: Partial<ReportContentForAdminDto>) {
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

export class ReportReasonCountDto {
  public reasonType: CONTENT_REPORT_REASON_TYPE;
  public description: CONTENT_REPORT_REASON_DESCRIPTION;
  public total: number;
}

export class ReportTargetDto {
  public target: PostDto | ArticleDto | CommentBaseDto;
  public reasonCounts: ReportReasonCountDto[];
}

export class TargetActorDto {
  public id: string;
  public avatar: string;
  public username: string;
  public fullname: string;

  public constructor(data: TargetActorDto) {
    Object.assign(this, data);
  }
}

export class ContentReportDetailDto {
  public content: string;

  public constructor(data: ContentReportDetailDto) {
    Object.assign(this, data);
  }
}

export class GetListReportsPaginationDto extends PaginatedResponse<ReportContentForAdminDto> {
  public constructor(list: ReportContentForAdminDto[], meta?: IPaginatedInfo) {
    super(list, meta);
  }
}
