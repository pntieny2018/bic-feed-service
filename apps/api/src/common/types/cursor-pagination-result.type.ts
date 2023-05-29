import { IPaginatedInfo } from '../dto/cusor-pagination';

export type CursorPaginationResult<T> = {
  rows: T[];
  meta: IPaginatedInfo;
};
