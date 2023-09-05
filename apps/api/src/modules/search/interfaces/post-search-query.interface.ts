import { PostType } from '../../v2-post/data-type';

export interface IPostSearchQuery {
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

  islimitSeries?: boolean;

  shouldHighligh?: boolean;
}

export interface ISearchPaginationQuery {
  from?: number;

  size?: number;
}

export interface IPaginationSearchResult<T> {
  total?: number;

  source?: T[];

  scrollId?: string;
}
