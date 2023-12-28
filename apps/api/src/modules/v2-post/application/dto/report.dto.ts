import {
  CONTENT_REPORT_REASON_DESCRIPTION,
  CONTENT_REPORT_REASON_TYPE,
  CONTENT_TARGET,
} from '@beincom/constants';
import { REPORT_SCOPE, REPORT_STATUS } from '@libs/database/postgres/model';
import { UserPublicProfileDto } from '@libs/service/user';

import { ArticleDto } from './article.dto';
import { CommentBaseDto } from './comment.dto';
import { PostDto } from './post.dto';

export class ReportDto {
  public id: string;
  public groupId: string;
  public reportTo: REPORT_SCOPE;
  public targetId: string;
  public targetType: CONTENT_TARGET;
  public targetActorId: string;
  public reasonsCount: ReportReasonCountDto[];
  public status: REPORT_STATUS;
  public processedBy?: string;
  public processedAt?: Date;
  public createdAt?: Date;
  public updatedAt?: Date;

  public constructor(data: Partial<ReportDto>) {
    Object.assign(this, data);
  }
}

export class ReportForManagerDto extends ReportDto {
  public content: string;
  public targetActor: UserPublicProfileDto;

  public constructor(data: Partial<ReportForManagerDto>) {
    super(data);
    Object.assign(this, data);
  }
}

export class ReportReasonCountDto {
  public reasonType: CONTENT_REPORT_REASON_TYPE;
  public description: CONTENT_REPORT_REASON_DESCRIPTION;
  public total: number;
  public reporters?: UserPublicProfileDto[];
}

export class ReportTargetDto {
  public target: PostDto | ArticleDto | CommentBaseDto;
  public reasonsCount: ReportReasonCountDto[];
}
