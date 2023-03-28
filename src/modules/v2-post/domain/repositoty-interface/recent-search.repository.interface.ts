import { RecentSearchEntity } from '../model/recent-search/recent-search.entity';

export type FindRecentSearchOptions = {
  keyword?: string;
  target?: string;
};
export interface IRecentSearchRepository {
  findOne(id: FindRecentSearchOptions): Promise<RecentSearchEntity>;
  create(data: RecentSearchEntity): Promise<void>;
  update(data: RecentSearchEntity): Promise<void>;
}

export const RECENT_SEARCH_REPOSITORY_TOKEN = Symbol('RECENT_SEARCH_REPOSITORY_TOKEN');
