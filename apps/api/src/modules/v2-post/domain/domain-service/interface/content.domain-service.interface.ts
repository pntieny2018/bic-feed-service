import { CONTENT_TYPE, ORDER } from '@beincom/constants';
import { PaginatedArgs } from '@libs/database/postgres/common';
import { UserDto } from '@libs/service/user';

import { CursorPaginationProps, CursorPaginationResult } from '../../../../../common/types';
import { ArticleEntity, PostEntity, SeriesEntity, ContentEntity } from '../../model/content';

export type GetDraftsProps = {
  authUserId: string;
  isProcessing?: boolean;
  type?: CONTENT_TYPE;
} & CursorPaginationProps;

export type GetContentByIdsProps = {
  authUserId: string;
  ids: string[];
};

export type GetScheduledContentProps = {
  beforeDate: Date;
} & CursorPaginationProps;

export type GetContentIdsInNewsFeedProps = {
  authUserId: string;
  isImportant?: boolean;
  isMine?: boolean;
  isSaved?: boolean;
  type?: CONTENT_TYPE;
} & CursorPaginationProps;

export type GetContentIdsInTimelineProps = {
  authUserId: string;
  groupIds: string[];
  isImportant?: boolean;
  isMine?: boolean;
  isSaved?: boolean;
  type?: CONTENT_TYPE;
} & CursorPaginationProps;

export type GetImportantContentIdsProps = {
  authUserId: string;
  isOnNewsfeed?: boolean;
  groupIds?: string[];
  isMine?: boolean;
  isSaved?: boolean;
  type?: CONTENT_TYPE;
} & CursorPaginationProps;

export class GetContentIdsScheduleProps extends PaginatedArgs {
  public order: ORDER;
  public user: UserDto;
  public type?: Exclude<CONTENT_TYPE, CONTENT_TYPE.SERIES>;
}

export interface IContentDomainService {
  getVisibleContent(id: string, excludeReportedByUserId?: string): Promise<ContentEntity>;
  getRawContent(contentEntity: ContentEntity): string;
  getContentByIds(
    data: GetContentByIdsProps
  ): Promise<(PostEntity | ArticleEntity | SeriesEntity)[]>;
  getContentIdsInNewsFeed(
    query: GetContentIdsInNewsFeedProps
  ): Promise<CursorPaginationResult<string>>;
  getContentIdsInTimeline(
    query: GetContentIdsInTimelineProps
  ): Promise<CursorPaginationResult<string>>;
  getDraftsPagination(
    data: GetDraftsProps
  ): Promise<CursorPaginationResult<PostEntity | ArticleEntity | SeriesEntity>>;
  getScheduledContent(
    input: GetScheduledContentProps
  ): Promise<CursorPaginationResult<PostEntity | ArticleEntity | SeriesEntity>>;
  getContentToBuildMenuSettings(
    id: string,
    userId: string
  ): Promise<PostEntity | ArticleEntity | SeriesEntity>;
  getReportedContentIdsByUser(reportUser: string, postTypes?: CONTENT_TYPE[]): Promise<string[]>;
  getScheduleContentIds(props: GetContentIdsScheduleProps): Promise<CursorPaginationResult<string>>;
  getSeriesInContent(contentId: string, authUserId: string): Promise<SeriesEntity[]>;
}
export const CONTENT_DOMAIN_SERVICE_TOKEN = 'CONTENT_DOMAIN_SERVICE_TOKEN';
