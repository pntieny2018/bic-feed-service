import { File, Image, Video } from '@libs/common/dtos';
import { IHttpService, MEDIA_HTTP_TOKEN } from '@libs/infra/http';
import { MEDIA_ENDPOINT } from '@libs/service/media/src/endpoint.constant';
import { Inject, Injectable, Logger } from '@nestjs/common';

import { IMediaService } from './interface';
import { Traceable } from '@libs/common/modules/opentelemetry';

@Traceable()
@Injectable()
export class MediaService implements IMediaService {
  private _logger = new Logger(MediaService.name);
  public constructor(@Inject(MEDIA_HTTP_TOKEN) private readonly _httpService: IHttpService) {}

  public async findFilesByIds(ids: string[]): Promise<File[]> {
    try {
      if (ids.length === 0) {
        return [];
      }

      const response = await this._httpService.post(MEDIA_ENDPOINT.INTERNAL.GET_FILES, ids);

      return response.data.data
        ? response.data.data.map(
            (i: any): File => ({
              id: i.id,
              url: i.originUrl,
              name: i.properties.name,
              mimeType: i.properties.mimeType,
              size: i.properties.size,
              createdBy: i.userId,
              status: i.status,
            })
          )
        : [];
    } catch (ex) {
      this._logger.debug(ex);
      return [];
    }
  }

  public async findImagesByIds(ids: string[]): Promise<Image[]> {
    try {
      if (ids.length === 0) {
        return [];
      }
      const response = await this._httpService.post(MEDIA_ENDPOINT.INTERNAL.GET_IMAGES, ids);

      return response.data.data
        ? response.data.data.map(
            (i: any): Image => ({
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

  public async findVideosByIds(ids: string[]): Promise<Video[]> {
    try {
      if (ids.length === 0) {
        return [];
      }
      const response = await this._httpService.post(MEDIA_ENDPOINT.INTERNAL.GET_VIDEOS, ids);

      return response.data.data
        ? response.data.data.map((i: any): Video => {
            return {
              id: i.id,
              url: i.originUrl,
              name: i.properties.name,
              mimeType: i.properties.mimeType,
              width: i.properties.width,
              height: i.properties.height,
              size: i.properties.size,
              duration: i.properties.duration,
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
