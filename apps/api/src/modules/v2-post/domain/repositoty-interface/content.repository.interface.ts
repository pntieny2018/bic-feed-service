import { CONTENT_TARGET } from '@beincom/constants';
import { CursorPaginationResult, PaginationProps } from '@libs/database/postgres/common';
import {
  FindContentIncludeOptions,
  FindContentProps,
  GetPaginationContentsProps,
} from '@libs/database/postgres/repository/interface';
import { UserDto } from '@libs/service/user';

import { PostEntity, ArticleEntity, ContentEntity, SeriesEntity } from '../model/content';

export type GetReportContentIdsProps = {
  reportUser: string;
  target?: CONTENT_TARGET[];
  groupIds?: string[];
};
export type GetCursorPaginationPostIdsInGroup = {
  groupIds: string[];
  limit: number;
  after: string;
};

export interface IContentRepository {
  create(data: PostEntity | ArticleEntity | SeriesEntity): Promise<void>;
  update(data: ContentEntity): Promise<void>;
  updateContentPrivacy(contentIds: string[], privacy: string): Promise<void>;
  delete(id: string): Promise<void>;

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
  findContentWithCache(
    findOnePostOptions: FindContentProps,
    user: UserDto
  ): Promise<PostEntity | ArticleEntity | SeriesEntity>;
  findAll(
    findAllPostOptions: FindContentProps,
    offsetPaginationProps?: PaginationProps
  ): Promise<(PostEntity | ArticleEntity | SeriesEntity)[]>;
  findContentsWithCache(
    findAllPostOptions: FindContentProps,
    offsetPaginationProps?: PaginationProps
  ): Promise<(PostEntity | ArticleEntity | SeriesEntity)[]>;

  getContentById(contentId: string): Promise<PostEntity | ArticleEntity | SeriesEntity>;
  getCursorPagination(
    getPaginationContentsProps: GetPaginationContentsProps
  ): Promise<CursorPaginationResult<PostEntity | ArticleEntity | SeriesEntity>>;

  countDraftContentByUserId(userId: string): Promise<number>;

  markSeen(postId: string, userId: string): Promise<void>;
  hasSeen(postId: string, userId: string): Promise<boolean>;
  markReadImportant(postId: string, userId: string): Promise<void>;
  getMarkReadImportant(postIds: string[], userId: string): Promise<Record<string, boolean>>;

  findPinnedContentIdsByGroupId(groupId: string): Promise<string[]>;
  reorderPinnedContent(contentIds: string[], groupId: string): Promise<void>;
  pinContent(contentId: string, groupIds: string[]): Promise<void>;
  unpinContent(contentId: string, groupIds: string[]): Promise<void>;
  saveContent(userId: string, contentId: string): Promise<void>;
  unSaveContent(userId: string, contentId: string): Promise<void>;
  getSavedContentIds(userId: string, contentIds: string[]): Promise<Record<string, boolean>>;

  createPostSeries(seriesId: string, postId: string): Promise<void>;
  deletePostSeries(seriesId: string, postId: string): Promise<void>;
  reorderPostsSeries(seriesId: string, itemIds: string[]): Promise<void>;
  getCursorPaginationPostIdsPublishedInGroup(
    getCursorPaginationPostIdsInGroup: GetCursorPaginationPostIdsInGroup
  ): Promise<{
    ids: string[];
    cursor: string;
  }>;
  hasBelongActiveGroupIds(contentId: string, groupIds: string[]): Promise<boolean>;
  getInterestedContentIdsByReporterId(contentIds: string[], reporterId: string): Promise<string[]>;
}

export const CONTENT_REPOSITORY_TOKEN = 'CONTENT_REPOSITORY_TOKEN';
