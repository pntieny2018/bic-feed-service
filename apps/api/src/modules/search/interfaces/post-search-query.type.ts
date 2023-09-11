import { CONTENT_TYPE } from '@beincom/constants';

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

  contentTypes?: CONTENT_TYPE[];

  excludeByIds?: string[];

  islimitSeries?: boolean;

  shouldHighligh?: boolean;
};

export type ISearchPaginationQuery = {
  from?: number;

  size?: number;

  searchAfter?: string;
};

export type IPaginationSearchResult<T> = {
  total?: number;

  source?: T[];

  cursor?: number[];
};
