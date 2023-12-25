import { CursorPaginationResult } from '@libs/database/postgres/common';
import { PostAttributes } from '@libs/database/postgres/model';
import {
  FindContentIncludeOptions,
  GetPaginationContentsProps,
} from '@libs/database/postgres/repository/interface';

export type GetPaginationPostIdsInGroup = {
  groupIds: string[];
  notInGroupIds?: string[];
  offset: number;
  limit: number;
};

export type CountNumerOfPostsInGroup = {
  groupIds: string[];
  notInGroupIds?: string[];
};

export interface IContentRepository {
  findContentByIdInActiveGroup(
    contentId: string,
    options?: FindContentIncludeOptions
  ): Promise<PostAttributes>;

  getCursorPagination(
    getPaginationContentsProps: GetPaginationContentsProps
  ): Promise<CursorPaginationResult<PostAttributes>>;

  getPaginationPostIdsPublishedInGroup(
    getPaginationPostIdsInGroup: GetPaginationPostIdsInGroup
  ): Promise<string[]>;
  hasBelongActiveGroupIds(contentId: string, groupIds: string[]): Promise<boolean>;
  countNumberOfPostsPublishedInGroup(props: CountNumerOfPostsInGroup): Promise<number>;
}

export const CONTENT_REPOSITORY_TOKEN = 'CONTENT_REPOSITORY_TOKEN';
