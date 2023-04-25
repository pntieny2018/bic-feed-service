import { GiphyResponseDto } from '../../driving-adapter/dto/response/giphy.response.dto';

export type GetTrendingGifsProps = {
  limit?: number;
  rating?: string;
  type: string;
};

export type SearchGifsProps = GetTrendingGifsProps & {
  q: string;
  offset?: number;
  lang?: string;
};

export interface IGiphyApplicationService {
  getTrendingGifs(props: GetTrendingGifsProps): Promise<GiphyResponseDto[]>;
  searchGifs(props: SearchGifsProps): Promise<GiphyResponseDto[]>;
}
export const GIPHY_APPLICATION_TOKEN = 'GIPHY_APPLICATION_TOKEN';
