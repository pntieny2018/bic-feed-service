import { InjectModel } from '@nestjs/sequelize';
import { LinkPreviewModel } from '../../../../database/models/link-preview.model';
import {
  ILinkPreviewFactory,
  LINK_PREVIEW_FACTORY_TOKEN,
} from '../../domain/factory/interface/link-preview.factory.interface';
import { HttpStatus, Inject, Logger } from '@nestjs/common';
import { IMediaRepository } from '../../domain/repositoty-interface/media.repository.interface';
import { FileEntity, ImageEntity, VideoEntity } from '../../domain/model/media';
import { lastValueFrom } from 'rxjs';
import { AxiosHelper } from '../../../../common/helpers';
import { ENDPOINT } from '../../../../common/constants/endpoint.constant';
import { HttpService } from '@nestjs/axios';
import { IAxiosConfig } from '../../../../config/axios';
import { ConfigService } from '@nestjs/config';
import { FileDto, ImageDto, VideoDto } from '../../application/dto';

export class MediaRepository implements IMediaRepository {
  private _logger = new Logger(MediaRepository.name);
  @Inject(LINK_PREVIEW_FACTORY_TOKEN)
  private readonly _linkPreviewFactory: ILinkPreviewFactory;
  @InjectModel(LinkPreviewModel)
  private readonly _linkPreviewModel: typeof LinkPreviewModel;

  private readonly _axiosConfig: IAxiosConfig;
  public constructor(
    private readonly _httpService: HttpService,
    private readonly _config: ConfigService
  ) {}

  public async findFiles(ids: string[]): Promise<FileEntity[]> {
    try {
      if (ids.length === 0) return [];

      const axiosConfig = this._config.get<IAxiosConfig>('axios');
      const response = await lastValueFrom(
        this._httpService.post(ENDPOINT.UPLOAD.INTERNAL.GET_FILES, ids, {
          baseURL: axiosConfig.upload.baseUrl,
        })
      );
      if (response.status !== HttpStatus.OK) {
        return null;
      }
      const data = AxiosHelper.getDataResponse<FileDto[]>(response);
      return data.map((file) => new FileEntity(file));
    } catch (ex) {
      this._logger.debug(ex);
      return [];
    }
  }

  public async findImages(ids: string[]): Promise<ImageEntity[]> {
    try {
      if (ids.length === 0) return [];
      const axiosConfig = this._config.get<IAxiosConfig>('axios');
      const response = await lastValueFrom(
        this._httpService.post(ENDPOINT.UPLOAD.INTERNAL.GET_IMAGES, ids, {
          baseURL: axiosConfig.upload.baseUrl,
        })
      );
      if (response.status !== HttpStatus.OK) {
        return null;
      }
      const data = AxiosHelper.getDataResponse<ImageDto[]>(response);
      return data.map((image) => new ImageEntity(image));
    } catch (ex) {
      this._logger.debug(ex);
      return [];
    }
  }

  public async findVideos(ids: string[]): Promise<VideoEntity[]> {
    try {
      if (ids.length === 0) return [];
      const axiosConfig = this._config.get<IAxiosConfig>('axios');
      const response = await lastValueFrom(
        this._httpService.post(ENDPOINT.UPLOAD.INTERNAL.GET_VIDEOS, ids, {
          baseURL: axiosConfig.upload.baseUrl,
        })
      );
      if (response.status !== HttpStatus.OK) {
        return null;
      }
      const data = AxiosHelper.getDataResponse<VideoDto[]>(response);
      return data.map((video) => new VideoEntity(video));
    } catch (ex) {
      this._logger.debug(ex);
      return [];
    }
  }
}
