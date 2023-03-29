import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { SearchGifsQuery } from './search-gifs.query';
import { GiphyDto } from './giphy.dto';

@QueryHandler(SearchGifsQuery)
export class SearchGifsHandler implements IQueryHandler<SearchGifsQuery, GiphyDto> {
  public async execute(query: SearchGifsQuery): Promise<GiphyDto> {
    return null;
  }
}
