import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetTrendingGifsQuery } from './get-trending-gifs.query';
import { GiphyDto } from './giphy.dto';
import { Inject } from '@nestjs/common';

@QueryHandler(GetTrendingGifsQuery)
export class GetTrendingGifsHandler implements IQueryHandler<GetTrendingGifsQuery, GiphyDto> {
  @Inject(GIPHY_QUERY_TOKEN) private readonly _giphyQuery: IGiphyQuery;
  public async execute(query: GetTrendingGifsQuery): Promise<GiphyDto> {
    return null;
  }
}
