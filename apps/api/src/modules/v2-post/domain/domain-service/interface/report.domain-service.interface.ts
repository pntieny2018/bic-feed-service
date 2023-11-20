import { CONTENT_REPORT_REASON_TYPE } from '@beincom/constants';
import { UserDto } from '@libs/service/user';

import { ReportReasonCountDto } from '../../../application/dto';
import { CommentEntity } from '../../model/comment';
import { ArticleEntity, PostEntity } from '../../model/content';
import { ReportDetailAttributes } from '../../model/report';

export type CreateReportProps = {
  authUser: UserDto;
  reasonType: CONTENT_REPORT_REASON_TYPE;
  reason?: string;
};

export type CreateReportContentProps = CreateReportProps & { content: PostEntity | ArticleEntity };
export type CreateReportCommentProps = CreateReportProps & { comment: CommentEntity };

export type ProcessReportProps = {
  authUser: UserDto;
  reportId: string;
  groupId: string;
};

export interface IReportDomainService {
  reportContent(input: CreateReportContentProps): Promise<void>;
  reportComment(input: CreateReportCommentProps): Promise<void>;
  countReportReasons(reportDetails: ReportDetailAttributes[]): ReportReasonCountDto[];
  ignoreReport(input: ProcessReportProps): Promise<void>;
}

export const REPORT_DOMAIN_SERVICE_TOKEN = 'REPORT_DOMAIN_SERVICE_TOKEN';
