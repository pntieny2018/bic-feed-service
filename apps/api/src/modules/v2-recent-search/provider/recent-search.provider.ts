import { RECENT_SEARCH_QUERY_TOKEN } from '../driven-adapter/query/interface/recent-search.query.interface';
import { RecentSearchRepository } from '../driven-adapter/repository/recent-search.repository';
import { CreateRecentSearchHandler } from '../aplication/command/create-recent-search/create-recent-search.handler';
import { DeleteRecentSearchHandler } from '../aplication/command/delete-recent-search/delete-recent-search.handler';
import { FindRecentSearchesPaginationHandler } from '../aplication/query/find-recent-searches/find-recent-searches-pagination.handler';
import { RECENT_SEARCH_DOMAIN_SERVICE_TOKEN } from '../domain/domain-service/interface';
import { RECENT_SEARCH_FACTORY_TOKEN } from '../domain/factory/interface/recent-search.factory.interface';
import { RecentSearchDomainService } from '../domain/domain-service/recent-search.domain-service';
import { RecentSearchQuery } from '../driven-adapter/query/recent-search.query';
import { RECENT_SEARCH_REPOSITORY_TOKEN } from '../driven-adapter/repository/interface/recent-search.repository.interface';
import { RecentSearchFactory } from '../domain/factory/recent-search.factory';

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
