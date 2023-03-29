import { RecentSearchEntity } from '../model/recent-search/recent-search.entity';

export type FindRecentSearchOptions = {
  id?: string;
  keyword?: string;
  target?: string;
  userId?: string;
};

export type DeleteRecentSearchOptions = {
  id?: string;
  keyword?: string;
  target?: string;
  userId?: string;
};

export interface IRecentSearchRepository {
  findOne(options: FindRecentSearchOptions): Promise<RecentSearchEntity>;
  create(data: RecentSearchEntity): Promise<void>;
  update(data: RecentSearchEntity): Promise<void>;
  delete(options: DeleteRecentSearchOptions): Promise<void>;
}

export const RECENT_SEARCH_REPOSITORY_TOKEN = Symbol('RECENT_SEARCH_REPOSITORY_TOKEN');
