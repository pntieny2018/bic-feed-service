import { IPaginatedInfo } from '@libs/database/postgres/common';

export type CursorPaginationResult<T> = {
  rows: T[];
  meta: IPaginatedInfo;
};
