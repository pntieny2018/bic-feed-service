import { CursorPaginationProps, CursorPaginationResult } from '@libs/database/postgres/common';

export type GetScheduledContentProps = {
  beforeDate: Date;
} & CursorPaginationProps;

export type ScheduledContentPaginationResult = CursorPaginationResult<{
  contentId: string;
  ownerId: string;
}>;

export interface IContentDomainService {
  getScheduledContent(input: GetScheduledContentProps): Promise<ScheduledContentPaginationResult>;
}
export const CONTENT_DOMAIN_SERVICE_TOKEN = 'CONTENT_DOMAIN_SERVICE_TOKEN';
