import { IFile, IImage, IVideo } from '@app/database/postgres/model/comment.model';
import { IHttpService, MEDIA_HTTP_TOKEN } from '@app/infra/http';
import { MEDIA_ENDPOINT } from '@app/service/media/src/endpoint.constant';
import { Inject, Injectable, Logger } from '@nestjs/common';

import { IMediaService } from './interface';

@Injectable()
export class MediaService implements IMediaService {
  private _logger = new Logger(MediaService.name);
  public constructor(@Inject(MEDIA_HTTP_TOKEN) private readonly _httpService: IHttpService) {}

  public async findFilesByIds(ids: string[]): Promise<IFile[]> {
    try {
      if (ids.length === 0) {
        return [];
      }

      const response = await this._httpService.post(MEDIA_ENDPOINT.INTERNAL.GET_FILES, ids);

      return response.data.data
        ? response.data.data.map(
            (i: any): IFile => ({
              id: i.id,
              url: i.originUrl,
              name: i.properties.name,
              mimeType: i.properties.mimeType,
              size: i.properties.size,
              createdBy: i.userId,
            })
          )
        : [];
    } catch (ex) {
      this._logger.debug(ex);
      return [];
    }
  }

  public async findImagesByIds(ids: string[]): Promise<IImage[]> {
    try {
      if (ids.length === 0) {
        return [];
      }
      const response = await this._httpService.post(MEDIA_ENDPOINT.INTERNAL.GET_IMAGES, ids);

      return response.data.data
        ? response.data.data.map(
            (i: any): IImage => ({
              id: i.id,
              url: i.url,
              src: i.src,
              createdBy: i.userId,
              mimeType: i.properties.mimeType,
              resource: i.resource,
              width: i.properties.width,
              height: i.properties.height,
              status: i.status,
            })
          )
        : [];
    } catch (ex) {
      this._logger.debug(ex);
      return [];
    }
  }

  public async findVideosByIds(ids: string[]): Promise<IVideo[]> {
    try {
      if (ids.length === 0) {
        return [];
      }
      const response = await this._httpService.post(MEDIA_ENDPOINT.INTERNAL.GET_VIDEOS, ids);

      return response.data.data
        ? response.data.data.map((i: any): IVideo => {
            return {
              id: i.id,
              url: i.originUrl,
              name: i.properties.name,
              mimeType: i.properties.mimeType,
              width: i.properties.width,
              height: i.properties.height,
              size: i.properties.size,
              thumbnails: i.thumbnails,
              createdBy: i.userId,
              status: i.status,
            };
          })
        : [];
    } catch (ex) {
      this._logger.debug(ex);
      return [];
    }
  }
}
