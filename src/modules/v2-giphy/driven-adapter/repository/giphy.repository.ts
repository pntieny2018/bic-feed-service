import { Injectable, Logger } from '@nestjs/common';
import { IGiphyRepository } from './interface/giphy.repository.interface';
import { HttpService } from '@nestjs/axios';
import { GiphyEntity } from '../../domain/giphy.entity';
import { lastValueFrom } from 'rxjs';
import {
  DEFAULT_GIPHY_REQUEST_TIME_OUT,
  GifType,
  GiphyHelper,
} from '../../../../common/helpers/giphy.helper';

@Injectable()
export class GiphyRepository implements IGiphyRepository {
  private readonly _logger = new Logger(GiphyRepository.name);

  public constructor(private readonly _httpService: HttpService) {}
  public async getTrendingGifs(
    limit?: number,
    rating?: string,
    type?: string
  ): Promise<GiphyEntity[]> {
    try {
      const response = await lastValueFrom(
        this._httpService.get('https://api.giphy.com/v1/gifs/trending', {
          params: {
            api_key: process.env.GIPHY_API_KEY,
            limit: limit,
            rating: rating,
          },
          timeout: DEFAULT_GIPHY_REQUEST_TIME_OUT,
        })
      );
      if (response.status === 200) {
        return response.data.data.map((e) => {
          const detailInfo = GiphyHelper.getGiphyDetailInfo(e.id, GifType[type], e.images);
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

  public async searchGifs(
    q: string,
    limit?: number,
    rating?: string,
    type?: string,
    offset?: number,
    lang?: string
  ): Promise<GiphyEntity[]> {
    try {
      const response = await lastValueFrom(
        this._httpService.get('https://api.giphy.com/v1/gifs/search', {
          params: {
            api_key: process.env.GIPHY_API_KEY,
            q: q,
            limit: limit,
            offset: offset,
            rating: rating,
            lang: lang,
          },
          timeout: DEFAULT_GIPHY_REQUEST_TIME_OUT,
        })
      );
      if (response.status === 200) {
        return response.data.data.map((e) => {
          const detailInfo = GiphyHelper.getGiphyDetailInfo(e.id, GifType[type], e.images);
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
