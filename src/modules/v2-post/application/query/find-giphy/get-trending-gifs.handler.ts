import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetTrendingGifsQuery } from './get-trending-gifs.query';
import { GiphyDto } from './giphy.dto';
import { Inject } from '@nestjs/common';
import { GIPHY_QUERY_TOKEN, IGiphyQuery } from '../../../domain/query-interface';

@QueryHandler(GetTrendingGifsQuery)
export class GetTrendingGifsHandler implements IQueryHandler<GetTrendingGifsQuery, GiphyDto[]> {
  @Inject(GIPHY_QUERY_TOKEN) private readonly _giphyQuery: IGiphyQuery;
  public async execute(query: GetTrendingGifsQuery): Promise<GiphyDto[]> {
    const entities = await this._giphyQuery.getTrendingGifs(query.payload);
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
