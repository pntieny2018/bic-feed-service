import { RECENT_SEARCH_QUERY_TOKEN } from '../domain/query-interface/recent-search.query.interface';
import { RecentSearchQuery } from '../driven-adapter/query';
import { RECENT_SEARCH_FACTORY_TOKEN, RecentSearchFactory } from '../domain/factory';
import { RECENT_SEARCH_REPOSITORY_TOKEN } from '../domain/repositoty-interface';
import { RecentSearchRepository } from '../driven-adapter/repository/recent-search.repository';
import { RECENT_SEARCH_DOMAIN_SERVICE_TOKEN } from '../domain/domain-service/interface';
import { RecentSearchDomainService } from '../domain/domain-service';
import { CreateRecentSearchHandler } from '../application/command/create-recent-search/create-recent-search.handler';
import { DeleteRecentSearchHandler } from '../application/command/delete-recent-search/delete-recent-search.handler';
import {
  FindRecentSearchesPaginationHandler
} from '../application/query/find-recent-searches/find-recent-searches-pagination.handler';

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
