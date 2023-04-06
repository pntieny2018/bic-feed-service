import { RECENT_SEARCH_QUERY_TOKEN } from '../driven-adapter/query/interface/recent-search.query.interface';
import { RecentSearchQuery } from '../../v2-post/driven-adapter/query';
import { RECENT_SEARCH_FACTORY_TOKEN, RecentSearchFactory } from '../../v2-post/domain/factory';
import { RECENT_SEARCH_REPOSITORY_TOKEN } from '../../v2-post/domain/repositoty-interface';
import { RecentSearchRepository } from '../driven-adapter/repository/recent-search.repository';
import { RecentSearchDomainService } from '../../v2-post/domain/domain-service';
import { CreateRecentSearchHandler } from '../aplication/command/create-recent-search/create-recent-search.handler';
import { DeleteRecentSearchHandler } from '../aplication/command/delete-recent-search/delete-recent-search.handler';
import { FindRecentSearchesPaginationHandler } from '../aplication/query/find-recent-searches/find-recent-searches-pagination.handler';
import { RECENT_SEARCH_DOMAIN_SERVICE_TOKEN } from '../domain/domain-service/interface';

export const recentSearchProvider = [
  {
    provide: RECENT_SEARCH_QUERY_TOKEN,
    useClass: RecentSearchQuery,
  },
  {
    provide: RECENT_SEARCH_FACTORY_TOKEN,
    useClass: RecentSearchFactory,
  },
  {
    provide: RECENT_SEARCH_REPOSITORY_TOKEN,
    useClass: RecentSearchRepository,
  },
  {
    provide: RECENT_SEARCH_DOMAIN_SERVICE_TOKEN,
    useClass: RecentSearchDomainService,
  },
  CreateRecentSearchHandler,
  DeleteRecentSearchHandler,
  FindRecentSearchesPaginationHandler,
];
