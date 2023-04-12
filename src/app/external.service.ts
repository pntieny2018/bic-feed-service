import { Injectable, Logger } from '@nestjs/common';
import { SentryService } from '@app/sentry';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AxiosHelper } from '../common/helpers';
import { ENDPOINT } from '../common/constants/endpoint.constant';

@Injectable()
export class ExternalService {
  /**
   * Logger
   * @private
   */
  private _logger = new Logger(ExternalService.name);
  private _uploadServiceEndpoint = process.env.UPLOAD_ENDPOINT;
  private _groupServiceEndpoint = process.env.GROUP_ENDPOINT;
  public constructor(
    private _sentryService: SentryService,
    private readonly _httpService: HttpService
  ) {}

  public async getFileIds(ids: string[]): Promise<any> {
    try {
      const response = await lastValueFrom(
        this._httpService.post(
          AxiosHelper.injectParamsToStrUrl(ENDPOINT.UPLOAD.INTERNAL.GET_FILES, {
            ids,
          })
        )
      );
      return response.data.data
        ? response.data.data.map((i) => ({
            id: i.id,
            url: i.origin_url,
            name: i.properties.name,
            originName: i.properties.name,
            mimeType: i.properties.mime_type,
            size: i.properties.size,
            createdAt: i.created_at ? new Date(i.created_at) : new Date(),
          }))
        : [];
    } catch (e) {
      return [];
    }
  }

  public async getVideoIds(ids: string[]): Promise<any> {
    try {
      const response = await lastValueFrom(
        this._httpService.post(
          AxiosHelper.injectParamsToStrUrl(ENDPOINT.UPLOAD.INTERNAL.GET_VIDEOS, {
            ids,
          })
        )
      );
      return response.data.data
        ? response.data.data.map((i) => ({
            id: i.id,
            url: i.origin_url,
            name: i.properties.name,
            originName: i.properties.name,
            mimeType: i.properties.mime_type,
            width: i.properties.width,
            height: i.properties.height,
            size: i.properties.size,
            thumbnails: i.thumbnails,
            createdAt: i.created_at ? new Date(i.created_at) : new Date(),
          }))
        : [];
    } catch (e) {
      return [];
    }
  }

  public async getImageIds(ids: string[]): Promise<any> {
    try {
      const response = await lastValueFrom(
        this._httpService.post(
          AxiosHelper.injectParamsToStrUrl(ENDPOINT.UPLOAD.INTERNAL.GET_IMAGES, {
            ids,
          })
        )
      );
      return response.data.data
        ? response.data.data.map((i) => ({
            id: i.id,
            url: i.url,
            createdBy: i.user_id,
            mimeType: i.properties.mime_type,
            width: i.properties.width,
            height: i.properties.height,
            status: i.status,
          }))
        : [];
    } catch (e) {
      return [];
    }
  }

  public async canCudTag(userId: string, rootGroupId: string): Promise<boolean> {
    try {
      const response = await lastValueFrom(
        this._httpService.get(
          `${this._groupServiceEndpoint}/internal/users/${userId}/can-cud-tags/${rootGroupId}`
        )
      );
      return response.data.data;
    } catch (e) {
      return false;
    }
  }

  public async updateMedia(
    id: string,
    data: {
      userId: string;
      type: string;
    }
  ): Promise<any> {
    const { userId, type } = data;
    try {
      const response = await lastValueFrom(
        this._httpService.put(
          AxiosHelper.injectParamsToStrUrl(ENDPOINT.UPLOAD.INTERNAL.UPDATE_IMAGES + `/${id}`, {
            resource: type,
            user_id: userId,
          })
        )
      );

      this._logger.debug('response.data', JSON.stringify(response.data));
      return {
        id: response.data.id,
        url: response.data.url,
        src: response.data.src,
        mimeType: response.data.properties.mime_type,
        width: response.data.properties.width,
        height: response.data.properties.height,
      };
    } catch (e) {
      this._logger.error(`Media ID: ${id} not found -- payload: ${JSON.stringify(data)}`);
      return null;
    }
  }
}
