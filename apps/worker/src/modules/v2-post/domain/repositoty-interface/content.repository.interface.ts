import { CursorPaginationResult } from '@libs/database/postgres/common';
import { PostAttributes } from '@libs/database/postgres/model';
import { GetPaginationContentsProps } from '@libs/database/postgres/repository/interface';

export interface IContentRepository {
  getCursorPagination(
    getPaginationContentsProps: GetPaginationContentsProps
  ): Promise<CursorPaginationResult<PostAttributes>>;
}

export const CONTENT_REPOSITORY_TOKEN = 'CONTENT_REPOSITORY_TOKEN';
