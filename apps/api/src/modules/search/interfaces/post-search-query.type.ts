import { PostType } from '../../v2-post/data-type';

export const ELASTICSEARCH_DEFAULT_SIZE_PAGE = 10;

export type IPostSearchQuery = {
  actors?: string[];

  keyword?: string;

  tags?: string[];

  tagName?: string;

  topics?: string[];

  startTime?: string;

  endTime?: string;

  groupIds?: string[];

  itemIds?: string[];

  contentTypes?: PostType[];

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
