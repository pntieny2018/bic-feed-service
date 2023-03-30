import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { SearchGifsQuery } from './search-gifs.query';
import { GiphyDto } from './giphy.dto';
import { Inject } from '@nestjs/common';
import { GIPHY_QUERY_TOKEN, IGiphyQuery } from '../../../domain/query-interface';

@QueryHandler(SearchGifsQuery)
export class SearchGifsHandler implements IQueryHandler<SearchGifsQuery, GiphyDto[]> {
  @Inject(GIPHY_QUERY_TOKEN) private readonly _giphyQuery: IGiphyQuery;

  public async execute(query: SearchGifsQuery): Promise<GiphyDto[]> {
    const entities = await this._giphyQuery.searchGifs(query.payload);
    return entities.map((e) => ({
      id: e.get('id'),
      type: e.get('type'),
      url: e.get('url'),
      height: e.get('height'),
      width: e.get('width'),
      size: e.get('size'),
    }));
  }
}
