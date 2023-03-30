import { GetTrendingGifsProps, IGiphyQuery, SearchGifsProps } from '../../domain/query-interface';
import { HttpService } from '@nestjs/axios';
import { GiphyEntity } from '../../domain/model/giphy/giphy.entity';
import {
  DEFAULT_GIPHY_REQUEST_TIME_OUT,
  GifType,
  GiphyHelper,
} from '../../../../common/helpers/giphy.helper';
import { lastValueFrom } from 'rxjs';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class GiphyQuery implements IGiphyQuery {
  private _logger = new Logger(GiphyQuery.name);
  public constructor(private readonly _httpService: HttpService) {}

  public async getTrendingGifs(props: GetTrendingGifsProps): Promise<GiphyEntity[]> {
    try {
      const response = await lastValueFrom(
        this._httpService.get('https://api.giphy.com/v1/gifs/trending', {
          params: {
            api_key: process.env.GIPHY_API_KEY,
            limit: props.limit,
            rating: props.rating,
          },
          timeout: DEFAULT_GIPHY_REQUEST_TIME_OUT,
        })
      );
      if (response.status === 200) {
        return response.data.data.map((e) => {
          const detailInfo = GiphyHelper.getGiphyDetailInfo(e.id, GifType[props.type], e.images);
          return new GiphyEntity({
            id: e.id,
            type: e.type,
            url: detailInfo.url,
            height: detailInfo.height,
            width: detailInfo.width,
            size: detailInfo.size,
          });
        });
      }
    } catch (e) {
      this._logger.error(e);
    }
    return [];
  }

  public async searchGifs(props: SearchGifsProps): Promise<GiphyEntity[]> {
    try {
      const response = await lastValueFrom(
        this._httpService.get('https://api.giphy.com/v1/gifs/search', {
          params: {
            api_key: process.env.GIPHY_API_KEY,
            q: props.q,
            limit: props.limit,
            offset: props.offset,
            rating: props.rating,
            lang: props.lang,
          },
          timeout: DEFAULT_GIPHY_REQUEST_TIME_OUT,
        })
      );
      if (response.status === 200) {
        return response.data.data.map((e) => {
          const detailInfo = GiphyHelper.getGiphyDetailInfo(e.id, GifType[props.type], e.images);
          return new GiphyEntity({
            id: e.id,
            type: e.type,
            url: detailInfo.url,
            height: detailInfo.height,
            width: detailInfo.width,
            size: detailInfo.size,
          });
        });
      }
    } catch (e) {
      this._logger.error(e);
    }
    return [];
  }
}
