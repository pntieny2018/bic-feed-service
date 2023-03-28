import { RecentSearchEntity } from '../model/recent-search/recent-search.entity';
import { RecentSearchType } from '../../data-type/recent-search-type.enum';

export type FindRecentSearchOptions = {
  id?: string;
  keyword?: string;
  target?: RecentSearchType;
};
export interface IRecentSearchRepository {
  findOne(id: FindRecentSearchOptions): Promise<RecentSearchEntity>;
  create(data: RecentSearchEntity): Promise<void>;
  update(data: RecentSearchEntity): Promise<void>;
  delete(data: RecentSearchEntity): Promise<void>;
}

export const RECENT_SEARCH_REPOSITORY_TOKEN = Symbol('RECENT_SEARCH_REPOSITORY_TOKEN');
