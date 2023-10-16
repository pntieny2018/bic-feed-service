import { CONTENT_TYPE, ORDER } from '@beincom/constants';
import { PaginatedArgs } from '@libs/database/postgres/common';
import { UserDto } from '@libs/service/user';

import { CursorPaginationProps, CursorPaginationResult } from '../../../../../common/types';
import {
  PinContentCommandProps,
  ReorderPinnedContentCommandPayload,
} from '../../../application/command/content';
import { GetContentAudienceProps } from '../../../application/query/content';
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
  type?: CONTENT_TYPE;
} & CursorPaginationProps;

export class GetContentIdsScheduleProps extends PaginatedArgs {
  public order: ORDER;
  public userId: string;
  public groupId?: string;
  public type?: Exclude<CONTENT_TYPE, CONTENT_TYPE.SERIES>;
}

export type UpdateSettingsProps = {
  contentId: string;
  authUser: UserDto;
  canComment: boolean;
  canReact: boolean;
  isImportant: boolean;
  importantExpiredAt: Date;
};

export type ReorderContentProps = ReorderPinnedContentCommandPayload;
export type PinContentProps = PinContentCommandProps;
export type GroupAudience = {
  id: string;
  name: string;
  isPinned: boolean;
};

export type GetAudiencesProps = GetContentAudienceProps;

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
    contentId: string,
    userId: string
  ): Promise<PostEntity | ArticleEntity | SeriesEntity>;
  getReportedContentIdsByUser(reportUser: string, postTypes?: CONTENT_TYPE[]): Promise<string[]>;
  getScheduleContentIds(props: GetContentIdsScheduleProps): Promise<CursorPaginationResult<string>>;
  getSeriesInContent(contentId: string, authUserId: string): Promise<SeriesEntity[]>;
  updateSetting(props: UpdateSettingsProps): Promise<void>;
  markSeen(contentId: string, userId: string): Promise<void>;
  markReadImportant(contentId: string, userId: string): Promise<void>;
  reorderPinned(props: ReorderContentProps): Promise<void>;
  findPinnedOrder(
    groupId: string,
    userId: string
  ): Promise<(PostEntity | ArticleEntity | SeriesEntity)[]>;
  updatePinnedContent(props: PinContentProps): Promise<void>;
  getAudiences(props: GetAudiencesProps): Promise<GroupAudience[]>;
  saveContent(contentId: string, authUser: UserDto): Promise<void>;
}
export const CONTENT_DOMAIN_SERVICE_TOKEN = 'CONTENT_DOMAIN_SERVICE_TOKEN';
