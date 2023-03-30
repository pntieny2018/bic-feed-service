import { Injectable, Logger } from '@nestjs/common';
import { SentryService } from '@app/sentry';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

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

  public async getFileIds(
    ids: string[],
    token: string = null,
    userPayload: string = null
  ): Promise<any> {
    try {
      const headers = {};
      if (token) headers['authorization'] = token;
      if (userPayload) headers['user'] = userPayload;
      const response = await lastValueFrom(
        this._httpService.post(`${this._uploadServiceEndpoint}/files/ids`, ids, {
          headers,
          baseURL: '',
        })
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

  public async getVideoIds(
    ids: string[],
    token: string = null,
    userPayload: string = null
  ): Promise<any> {
    try {
      const headers = {};
      if (token) headers['authorization'] = token;
      if (userPayload) headers['user'] = userPayload;
      const response = await lastValueFrom(
        this._httpService.post(`${this._uploadServiceEndpoint}/videos/ids`, ids, {
          headers,
        })
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
    try {
      const { userId, type } = data;
      const response = await lastValueFrom(
        this._httpService.post(`${this._uploadServiceEndpoint}/internal/${id}`, {
          userId,
          type,
        })
      );

      this._logger.debug('response.data', JSON.stringify(response.data));
      const result = response.data.data
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

      return result;
    } catch (e) {
      throw e;
    }
  }
}
