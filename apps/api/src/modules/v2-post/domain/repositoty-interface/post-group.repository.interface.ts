import { CursorPaginationProps, CursorPaginationResult } from '@libs/database/postgres/common';
import { PostGroupAttributes } from '@libs/database/postgres/model';

export type GetPaginationPostGroupProps = {
  where: {
    groupIds: string[];
    isArchived?: boolean;
  };
} & CursorPaginationProps;

export interface IPostGroupRepository {
  getNotInStateGroupIds(groupIds: string[], isArchived: boolean): Promise<string[]>;
  getPagination(
    input: GetPaginationPostGroupProps
  ): Promise<CursorPaginationResult<PostGroupAttributes>>;

  updateGroupState(groupIds: string[], isArchived: boolean): Promise<void>;
}

export const POST_GROUP_REPOSITORY_TOKEN = 'POST_GROUP_REPOSITORY_TOKEN';
