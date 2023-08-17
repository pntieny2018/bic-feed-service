import { CursorPaginationProps } from '../../../../../common/types/cursor-pagination-props.type';
import { CursorPaginationResult } from '../../../../../common/types/cursor-pagination-result.type';
import { PostType } from '../../../data-type';
import { ArticleEntity, PostEntity, SeriesEntity, ContentEntity } from '../../model/content';

export type GetDraftsProps = {
  authUserId: string;
  isProcessing?: boolean;
  type?: PostType;
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
  type?: PostType;
} & CursorPaginationProps;

export interface IContentDomainService {
  getVisibleContent(id: string, excludeReportedByUserId?: string): Promise<ContentEntity>;
  getRawContent(contentEntity: ContentEntity): string;
  getContentByIds(
    data: GetContentByIdsProps
  ): Promise<(PostEntity | ArticleEntity | SeriesEntity)[]>;
  getContentIdsInNewsFeed(
    query: GetContentIdsInNewsFeedProps
  ): Promise<CursorPaginationResult<string>>;
  getDraftsPagination(
    data: GetDraftsProps
  ): Promise<CursorPaginationResult<PostEntity | ArticleEntity | SeriesEntity>>;
  getScheduledContent(
    input: GetScheduledContentProps
  ): Promise<CursorPaginationResult<PostEntity | ArticleEntity | SeriesEntity>>;
}
export const CONTENT_DOMAIN_SERVICE_TOKEN = 'CONTENT_DOMAIN_SERVICE_TOKEN';
