import { RecentSearchEntity } from '../../model/recent-search/recent-search.entity';

export type RecentSearchCreateProps = {
  keyword: string;
  target: string;
  userId: string;
};

export type RecentSearchUpdateProps = {
  keyword: string;
  id: string;
  userId: string;
};

export interface IRecentSearchDomainService {
  createRecentSearch(data: RecentSearchCreateProps): Promise<RecentSearchEntity>;
  updateRecentSearch(
    entity: RecentSearchEntity,
    input: RecentSearchUpdateProps
  ): Promise<RecentSearchEntity>;
}

export const RECENT_SEARCH_DOMAIN_SERVICE_TOKEN = 'RECENT_SEARCH_DOMAIN_SERVICE_TOKEN';
