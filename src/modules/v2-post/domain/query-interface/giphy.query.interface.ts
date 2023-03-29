import { GiphyEntity } from '../model/giphy/giphy.entity';

export type GetTrendingGifsProps = {
  limit?: number;
  rating?: string;
  type?: string;
};

export type SearchGifsProps = GetTrendingGifsProps & {
  q: string;
  offset?: number;
  lang?: string;
};

export interface IGiphyQuery {
  getTrendingGifs(): Promise<GiphyEntity[]>;
  searchGifs(query: string): Promise<GiphyEntity[]>;
}

export const GIPHY_QUERY_TOKEN = 'GIPHY_QUERY_TOKEN';
