import {
  CONTENT_REPORT_REASON_DESCRIPTION,
  CONTENT_REPORT_REASON_TYPE,
  CONTENT_TARGET,
} from '@beincom/constants';
import { REPORT_SCOPE, REPORT_STATUS } from '@libs/database/postgres/model';

import { ArticleDto } from './article.dto';
import { CommentBaseDto } from './comment.dto';
import { PostDto } from './post.dto';

export class ReportDto {
  public id: string;
  public targetId: string;
  public targetType: CONTENT_TARGET;
  public authorId: string;
  public status: REPORT_STATUS;
  public updatedBy?: string;
  public createdAt?: Date;
  public updatedAt?: Date;
  public details?: ReportDetailDto[];

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

export class ReportReasonCountDto {
  public reasonType: CONTENT_REPORT_REASON_TYPE;
  public description: CONTENT_REPORT_REASON_DESCRIPTION;
  public total: number;
}

export class ReportTargetDto {
  public target: PostDto | ArticleDto | CommentBaseDto;
  public reasonCounts: ReportReasonCountDto[];
}
