import {
  GetTrendingGifsProps,
  IGiphyApplicationService,
  SearchGifsProps,
} from './interface/giphy.app-service.interface';
import {
  GIPHY_REPOSITORY_TOKEN,
  IGiphyRepository,
} from '../driven-adapter/repository/interface/giphy.repository.interface';
import { Inject } from '@nestjs/common';
import { GiphyDto } from '../driving-adapter/dto/giphy.dto';

export class GiphyApplicationService implements IGiphyApplicationService {
  @Inject(GIPHY_REPOSITORY_TOKEN)
  private readonly _repo: IGiphyRepository;

  public async getTrendingGifs(props: GetTrendingGifsProps): Promise<GiphyDto[]> {
    const { limit, rating, type } = props;
    const result = await this._repo.getTrendingGifs(limit, rating, type);
    return result.map((e) => ({
      id: e.get('id'),
      type: e.get('type'),
      url: e.get('url'),
      height: e.get('height'),
      width: e.get('width'),
      size: e.get('size'),
    }));
  }

  public async searchGifs(props: SearchGifsProps): Promise<GiphyDto[]> {
    const { q, limit, rating, type, offset, lang } = props;
    const result = await this._repo.searchGifs(q, limit, rating, type, offset, lang);
    return result.map((e) => ({
      id: e.get('id'),
      type: e.get('type'),
      url: e.get('url'),
      height: e.get('height'),
      width: e.get('width'),
      size: e.get('size'),
    }));
  }
}
