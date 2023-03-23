import { RecentSearchEntity, RecentSearchProps } from '../model/recent-search/recent-search.entity';

export interface IRecentSearchFactory {
  reconstitute(props: RecentSearchProps): RecentSearchEntity;
}
export const RECENT_SEARCH_FACTORY_TOKEN = 'RECENT_SEARCH_FACTORY_TOKEN';
