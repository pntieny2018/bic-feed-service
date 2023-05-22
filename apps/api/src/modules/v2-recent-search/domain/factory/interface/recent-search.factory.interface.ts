import {
  RecentSearchEntity,
  RecentSearchProps,
} from '../../model/recent-search/recent-search.entity';

export type CreateRecentSearchOptions = Readonly<{
  keyword: string;
  target: string;
  totalSearched: number;
  createdBy: string;
  updatedBy: string;
}>;

export interface IRecentSearchFactory {
  create(props: CreateRecentSearchOptions): RecentSearchEntity;
  reconstitute(props: RecentSearchProps): RecentSearchEntity;
}
export const RECENT_SEARCH_FACTORY_TOKEN = 'RECENT_SEARCH_FACTORY_TOKEN';
