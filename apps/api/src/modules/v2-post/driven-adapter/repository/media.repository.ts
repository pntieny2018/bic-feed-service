import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { lastValueFrom } from 'rxjs';

import { ENDPOINT } from '../../../../common/constants/endpoint.constant';
import { IAxiosConfig } from '../../../../config/axios';
import { LinkPreviewModel } from '../../../../database/models/link-preview.model';
import {
  ILinkPreviewFactory,
  LINK_PREVIEW_FACTORY_TOKEN,
} from '../../domain/factory/interface/link-preview.factory.interface';
import { FileEntity, ImageEntity, VideoEntity } from '../../domain/model/media';
import { IMediaRepository } from '../../domain/repositoty-interface/media.repository.interface';

@Injectable()
export class MediaRepository implements IMediaRepository {
  private _logger = new Logger(MediaRepository.name);
  @Inject(LINK_PREVIEW_FACTORY_TOKEN)
  private readonly _linkPreviewFactory: ILinkPreviewFactory;
  @InjectModel(LinkPreviewModel)
  private readonly _linkPreviewModel: typeof LinkPreviewModel;

  public constructor(
    private readonly _httpService: HttpService,
    private readonly _config: ConfigService
  ) {}

  public async findFiles(ids: string[]): Promise<FileEntity[]> {
    try {
      if (ids.length === 0) {
        return [];
      }

      const axiosConfig = this._config.get<IAxiosConfig>('axios');
      const response = await lastValueFrom(
        this._httpService.post(ENDPOINT.UPLOAD.INTERNAL.GET_FILES, ids, {
          baseURL: axiosConfig.upload.baseUrl,
        })
      );

      return response.data.data
        ? response.data.data.map(
            (i) =>
              new FileEntity({
                id: i.id,
                url: i.origin_url,
                name: i.properties.name,
                mimeType: i.properties.mime_type,
                size: i.properties.size,
                createdBy: i.user_id,
              })
          )
        : [];
    } catch (ex) {
      this._logger.debug(ex);
      return [];
    }
  }

  public async findImages(ids: string[]): Promise<ImageEntity[]> {
    try {
      if (ids.length === 0) {
        return [];
      }
      const axiosConfig = this._config.get<IAxiosConfig>('axios');
      const response = await lastValueFrom(
        this._httpService.post(ENDPOINT.UPLOAD.INTERNAL.GET_IMAGES, ids, {
          baseURL: axiosConfig.upload.baseUrl,
        })
      );

      return response.data.data
        ? response.data.data.map(
            (i) =>
              new ImageEntity({
                id: i.id,
                url: i.url,
                src: i.src,
                createdBy: i.user_id,
                mimeType: i.properties.mime_type,
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

  public async findVideos(ids: string[]): Promise<VideoEntity[]> {
    try {
      if (ids.length === 0) {
        return [];
      }
      const axiosConfig = this._config.get<IAxiosConfig>('axios');
      const response = await lastValueFrom(
        this._httpService.post(ENDPOINT.UPLOAD.INTERNAL.GET_VIDEOS, ids, {
          baseURL: axiosConfig.upload.baseUrl,
        })
      );

      return response.data.data
        ? response.data.data.map(
            (i) =>
              new VideoEntity({
                id: i.id,
                url: i.origin_url,
                name: i.properties.name,
                mimeType: i.properties.mime_type,
                width: i.properties.width,
                height: i.properties.height,
                size: i.properties.size,
                thumbnails: i.thumbnails,
                createdBy: i.user_id,
                status: i.status,
              })
          )
        : [];
    } catch (ex) {
      this._logger.debug(ex);
      return [];
    }
  }
}
