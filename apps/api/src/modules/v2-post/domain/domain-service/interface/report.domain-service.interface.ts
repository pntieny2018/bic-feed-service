import { CONTENT_REPORT_REASON_TYPE } from '@beincom/constants';
import { CursorPaginationProps, CursorPaginationResult } from '@libs/database/postgres/common';
import { UserDto } from '@libs/service/user';

import { CommentEntity } from '../../model/comment';
import { ArticleEntity, PostEntity } from '../../model/content';
import { ReportEntity } from '../../model/report';

export type CreateReportProps = {
  authUser: UserDto;
  reasonType: CONTENT_REPORT_REASON_TYPE;
  reason?: string;
};

export type CreateReportContentProps = CreateReportProps & { content: PostEntity | ArticleEntity };
export type CreateReportCommentProps = CreateReportProps & { comment: CommentEntity };
export type GetListReportsProps = CursorPaginationProps & {
  rootGroupId: string;
};

export interface IReportDomainService {
  reportContent(input: CreateReportContentProps): Promise<void>;
  reportComment(input: CreateReportCommentProps): Promise<void>;
  getListReports(input: GetListReportsProps): Promise<CursorPaginationResult<ReportEntity>>;
  getReport(id: string): Promise<ReportEntity>;
}

export const REPORT_DOMAIN_SERVICE_TOKEN = 'REPORT_DOMAIN_SERVICE_TOKEN';
