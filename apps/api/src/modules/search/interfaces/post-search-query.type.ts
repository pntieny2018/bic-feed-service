import { CONTENT_TYPE } from '@beincom/constants';

export const ELASTICSEARCH_DEFAULT_SIZE_PAGE = 10;

export type IPostSearchQuery = {
  actors?: string[];

  keyword?: string;

  tagIds?: string[];

  tagNames?: string[];

  topics?: string[];

  startTime?: string;

  endTime?: string;

  groupIds?: string[];

  itemIds?: string[];

  contentTypes?: CONTENT_TYPE[];

  excludeByIds?: string[];

  isLimitSeries?: boolean;

  shouldHighlight?: boolean;
};

export type ISearchPaginationQuery = {
  from?: number;

  size?: number;

  searchAfter?: unknown;
};

export type IPaginationSearchResult<T> = {
  total?: number;

  source?: T[];

  cursor?: number[];
};
