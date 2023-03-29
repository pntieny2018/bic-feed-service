import { PaginationProps } from '../../../../common/types/pagination-props.type ';
import { PaginationResult } from '../../../../common/types/pagination-result.type';
import { RecentSearchEntity } from '../model/recent-search/recent-search.entity';
import { OrderEnum } from '../../../../common/dto';

export type GetPaginationRecentSearchProps = PaginationProps & {
  keyword?: string;
  target?: string;
  userId: string;
  offset: number;
  limit: number;
  order?: OrderEnum;
};

export interface IRecentSearchQuery {
  getPagination(
    input: GetPaginationRecentSearchProps
  ): Promise<PaginationResult<RecentSearchEntity>>;
}

export const RECENT_SEARCH_QUERY_TOKEN = 'RECENT_SEARCH_QUERY_TOKEN';
