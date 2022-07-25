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
        })
      );
      return response.data.data
        ? response.data.data.map((i) => ({
            id: i.id,
            url: i.originUrl,
            name: i.properties.name,
            originName: i.properties.name,
            mimeType: i.properties.mimeType,
            size: i.properties.size,
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
            url: i.originUrl,
            name: i.properties.name,
            originName: i.properties.name,
            mimeType: i.properties.mimeType,
            width: i.properties.width,
            height: i.properties.height,
            size: i.properties.size,
            thumbnails: i.thumbnails,
          }))
        : [];
    } catch (e) {
      return [];
    }
  }

  public async getPermission(payload: string): Promise<any> {
    try {
      const response = await lastValueFrom(
        this._httpService.get(`${this._groupServiceEndpoint}/me/permissions`, {
          headers: {
            user: payload,
          },
        })
      );
      return response.data.data;
    } catch (e) {
      return {};
    }
  }
}
