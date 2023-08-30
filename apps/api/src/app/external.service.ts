import * as fs from 'fs';

import { SentryService } from '@libs/infra/sentry';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';

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
    if (ids.length === 0) {
      return [];
    }
    try {
      const response = await lastValueFrom(
        this._httpService.post(
          this._uploadServiceEndpoint + ENDPOINT.UPLOAD.INTERNAL.GET_FILES,
          ids,
          {
            baseURL: '',
          }
        )
      );
      return response.data.data
        ? response.data.data.map((i) => ({
            id: i.id,
            url: i.origin_url,
            name: i.properties.name,
            mimeType: i.properties.mime_type,
            size: i.properties.size,
            createdBy: i.user_id,
          }))
        : [];
    } catch (e) {
      return [];
    }
  }

  public async getVideoIds(ids: string[]): Promise<any> {
    if (ids.length === 0) {
      return [];
    }
    try {
      const response = await lastValueFrom(
        this._httpService.post(
          this._uploadServiceEndpoint + ENDPOINT.UPLOAD.INTERNAL.GET_VIDEOS,
          ids,
          {
            baseURL: '',
          }
        )
      );
      return response.data.data
        ? response.data.data.map((i) => ({
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
          }))
        : [];
    } catch (e) {
      return [];
    }
  }

  public async getImageIds(ids: string[]): Promise<any> {
    if (ids.length === 0) {
      return [];
    }
    try {
      const response = await lastValueFrom(
        this._httpService.post(
          this._uploadServiceEndpoint + ENDPOINT.UPLOAD.INTERNAL.GET_IMAGES,
          ids,
          {
            baseURL: '',
          }
        )
      );
      return response.data.data
        ? response.data.data.map((i) => ({
            id: i.id,
            url: i.url,
            src: i.src,
            createdBy: i.user_id,
            mimeType: i.properties.mime_type,
            resource: i.resource,
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
      url: string;
      entityId: string;
    }
  ): Promise<any> {
    const { userId, type } = data;
    try {
      const response = await lastValueFrom(
        this._httpService.post(
          `${this._uploadServiceEndpoint + ENDPOINT.UPLOAD.INTERNAL.UPDATE_IMAGES}/${id}/copy`,
          {
            resource: type,
            user_id: userId,
          },
          {
            baseURL: '',
          }
        )
      );

      const data = response.data.data;
      return {
        id: data.id,
        originId: id,
        url: data.url,
        src: data.src,
        mimeType: data.properties.mime_type,
        width: data.properties.width,
        height: data.properties.height,
        status: data.status,
        resource: data.resource,
      };
    } catch (e) {
      const exist = await fs.existsSync(data.url);
      if (exist) {
        console.error(`${JSON.stringify(e.message)}, payload:${JSON.stringify(data)}`);
        this._logger.debug(
          `[ERROR UPLOAD SERVICE] ${JSON.stringify(e.message)}, payload:${JSON.stringify(data)}`
        );
      }

      return null;
    }
  }
}
