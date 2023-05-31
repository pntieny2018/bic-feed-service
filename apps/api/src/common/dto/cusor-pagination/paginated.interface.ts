export interface IPaginatedInfo {
  previousCursor?: string;
  nextCursor?: string;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface IPaginatedResponse<T> {
  list: T[];
  meta?: IPaginatedInfo;
}

export interface IPaginationArgs {
  limit?: number;
  previousCursor?: string;
  nextCursor?: string;
}
