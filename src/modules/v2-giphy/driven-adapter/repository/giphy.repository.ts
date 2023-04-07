import { Injectable, Logger } from '@nestjs/common';
import { IGiphyRepository } from './interface/giphy.repository.interface';
import { HttpService } from '@nestjs/axios';
import { GiphyEntity } from '../../domain/giphy.entity';
import { lastValueFrom } from 'rxjs';
import { GifType } from '../../data-type';
export const DEFAULT_GIPHY_REQUEST_TIME_OUT = 4500; // 4,5s

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
          const detailInfo = this.getGiphyDetailInfo(e.id, GifType[type], e.images);
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
          const detailInfo = this.getGiphyDetailInfo(e.id, GifType[type], e.images);
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

  public getGiphyDetailInfo(
    id?: string,
    type: GifType = GifType.PREVIEW_GIF,
    images?: object
  ): { url: string; height: string; width: string; size: string } {
    if (!id) return null;
    if (type === GifType.ORIGINAL) {
      return {
        url: 'https://i.giphy.com/' + id + '.gif',
        height: images['original'] ? images['original'].height : null,
        width: images['original'] ? images['original'].width : null,
        size: images['original'] ? images['original'].size : null,
      };
    } else if (type === GifType.PREVIEW_GIF) {
      return {
        url: 'https://i.giphy.com/media/' + id + '/giphy.gif',
        height: images['preview_gif'] ? images['preview_gif'].height : null,
        width: images['preview_gif'] ? images['preview_gif'].width : null,
        size: images['preview_gif'] ? images['preview_gif'].size : null,
      };
    } else if (type === GifType.PREVIEW_WEBP) {
      return {
        url: 'https://i.giphy.com/media/' + id + '/giphy.webp',
        height: images['preview_webp'] ? images['preview_webp'].height : null,
        width: images['preview_webp'] ? images['preview_webp'].width : null,
        size: images['preview_webp'] ? images['preview_webp'].size : null,
      };
    }
  }
}
