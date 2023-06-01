export interface IPaginatedInfo {
  startCursor?: string;
  endCursor?: string;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface IPaginatedResponse<T> {
  list: T[];
  meta?: IPaginatedInfo;
}

export interface IPaginationArgs {
  limit?: number;
  before?: string;
  after?: string;
}

export type CursorParam = Record<string, Date | string | number>;
