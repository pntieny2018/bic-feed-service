import { CONTENT_TARGET } from '@beincom/constants';
import { CursorPaginationResult, PaginationProps } from '@libs/database/postgres/common';
import {
  FindContentIncludeOptions,
  FindContentProps,
  GetPaginationContentsProps,
} from '@libs/database/postgres/repository/interface';

import { PostEntity, ArticleEntity, ContentEntity, SeriesEntity } from '../model/content';

export type GetReportContentIdsProps = {
  reportUser: string;
  target?: CONTENT_TARGET[];
  groupId?: string;
};

export interface IContentRepository {
  create(data: PostEntity | ArticleEntity | SeriesEntity): Promise<void>;
  update(data: ContentEntity): Promise<void>;
  findContentById(
    contentId: string,
    options?: FindContentIncludeOptions
  ): Promise<PostEntity | ArticleEntity | SeriesEntity>;
  findContentByIdInActiveGroup(
    contentId: string,
    options?: FindContentIncludeOptions
  ): Promise<PostEntity | ArticleEntity | SeriesEntity>;
  findContentByIdInArchivedGroup(
    contentId: string,
    options?: FindContentIncludeOptions
  ): Promise<PostEntity | ArticleEntity | SeriesEntity>;
  findContentByIdExcludeReportedByUserId(
    contentId: string,
    userId: string,
    options?: FindContentIncludeOptions
  ): Promise<PostEntity | ArticleEntity | SeriesEntity>;
  findOne(findOnePostOptions: FindContentProps): Promise<PostEntity | ArticleEntity | SeriesEntity>;
  getContentById(contentId: string): Promise<PostEntity | ArticleEntity | SeriesEntity>;
  findAll(
    findAllPostOptions: FindContentProps,
    offsetPaginationProps?: PaginationProps
  ): Promise<(PostEntity | ArticleEntity | SeriesEntity)[]>;

  delete(id: string): Promise<void>;
  markSeen(postId: string, userId: string): Promise<void>;
  hasSeen(postId: string, userId: string): Promise<boolean>;
  markReadImportant(postId: string, userId: string): Promise<void>;
  getPagination(
    getPaginationContentsProps: GetPaginationContentsProps
  ): Promise<CursorPaginationResult<PostEntity | ArticleEntity | SeriesEntity>>;
  getReportedContentIdsByUser(props: GetReportContentIdsProps): Promise<string[]>;
  countContentDraft(userId: string): Promise<number>;
  findPinnedPostIdsByGroupId(groupId: string): Promise<string[]>;
  reorderPinnedContent(contentIds: string[], groupId: string): Promise<void>;
  pinContent(contentId: string, groupIds: string[]): Promise<void>;
  unpinContent(contentId: string, groupIds: string[]): Promise<void>;
}

export const CONTENT_REPOSITORY_TOKEN = 'CONTENT_REPOSITORY_TOKEN';
