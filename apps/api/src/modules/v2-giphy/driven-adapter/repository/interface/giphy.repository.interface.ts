import { GiphyEntity } from '../../../domain/giphy.entity';

export interface IGiphyRepository {
  getTrendingGifs(limit?: number, rating?: string, type?: string): Promise<GiphyEntity[]>;

  searchGifs(
    q: string,
    limit?: number,
    rating?: string,
    type?: string,
    offset?: number,
    lang?: string
  ): Promise<GiphyEntity[]>;
}

export const GIPHY_REPOSITORY_TOKEN = 'GIPHY_REPOSITORY_TOKEN';
