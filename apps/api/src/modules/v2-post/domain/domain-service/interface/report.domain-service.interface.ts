import { CONTENT_REPORT_REASON_TYPE } from '@beincom/constants';
import { UserDto } from '@libs/service/user';

import { CommentEntity } from '../../model/comment';
import { ArticleEntity, PostEntity } from '../../model/content';

export type CreateReportProps = {
  authUser: UserDto;
  reasonType: CONTENT_REPORT_REASON_TYPE;
  reason?: string;
};

export type CreateReportContentProps = CreateReportProps & { content: PostEntity | ArticleEntity };
export type CreateReportCommentProps = CreateReportProps & { comment: CommentEntity };

export interface IReportDomainService {
  reportContent(input: CreateReportContentProps): Promise<void>;
  reportComment(input: CreateReportCommentProps): Promise<void>;
}

export const REPORT_DOMAIN_SERVICE_TOKEN = 'REPORT_DOMAIN_SERVICE_TOKEN';
