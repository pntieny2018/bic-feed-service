import { CursorPaginationResult } from '@libs/database/postgres/common';
import { PostAttributes } from '@libs/database/postgres/model';
import {
  FindContentIncludeOptions,
  GetPaginationContentsProps,
} from '@libs/database/postgres/repository/interface';

export type GetCursorPaginationPostIdsInGroup = {
  groupIds: string[];
  limit: number;
  after: string;
};

export interface IContentRepository {
  findContentByIdInActiveGroup(
    contentId: string,
    options?: FindContentIncludeOptions
  ): Promise<PostAttributes>;

  getCursorPagination(
    getPaginationContentsProps: GetPaginationContentsProps
  ): Promise<CursorPaginationResult<PostAttributes>>;

  getCursorPaginationPostIdsPublishedInGroup(
    getCursorPaginationPostIdsInGroup: GetCursorPaginationPostIdsInGroup
  ): Promise<{
    ids: string[];
    cursor: string;
  }>;
  hasBelongActiveGroupIds(contentId: string, groupIds: string[]): Promise<boolean>;
}

export const CONTENT_REPOSITORY_TOKEN = 'CONTENT_REPOSITORY_TOKEN';
