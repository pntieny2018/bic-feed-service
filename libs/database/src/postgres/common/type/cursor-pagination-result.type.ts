import { IPaginatedInfo } from '@app/database/postgres/common';

export type CursorPaginationResult<T> = {
  rows: T[];
  meta: IPaginatedInfo;
};
