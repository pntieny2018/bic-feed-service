import { GIPHY_QUERY_TOKEN } from '../domain/query-interface';
import { GiphyQuery } from '../driven-adapter/query';
import { SearchGifsHandler } from '../application/query/find-giphy/search-gifs.handler';
import { GetTrendingGifsHandler } from '../application/query/find-giphy/get-trending-gifs.handler';

export const giphyProvider = [
  {
    provide: GIPHY_QUERY_TOKEN,
    useClass: GiphyQuery,
  },
  SearchGifsHandler,
  GetTrendingGifsHandler,
];
