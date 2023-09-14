import { HEADER_REQ_ID } from '@libs/common/constants';
import {
  IHttpServiceResponse,
  IHttpService,
  IHttpServiceRequestOptions,
  IHttpServiceOptions,
} from '@libs/infra/http';
import { Injectable } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import camelcaseKeys from 'camelcase-keys';
import { merge } from 'lodash';
import { ClsServiceManager } from 'nestjs-cls';
import { v4 } from 'uuid';

@Injectable()
export class HttpService implements IHttpService {
  public constructor(private readonly options: IHttpServiceOptions) {
    this.options.headers = this.options.headers || {};

    const { version } = this.options;
    if (version) {
      this.options.headers['x-version-id'] = version;
    }
  }

  public async get<T = any>(
    path: string,
    params: object = {},
    options: IHttpServiceRequestOptions = {}
  ): Promise<IHttpServiceResponse<T>> {
    return this.getResponse<T>(axios.get(path, this.getConfigs({ ...options, ...params })));
  }

  public async post<T = any>(
    path: string,
    data: object = {},
    options: IHttpServiceRequestOptions = {}
  ): Promise<IHttpServiceResponse<T>> {
    return this.getResponse<T>(axios.post(path, data, this.getConfigs(options)));
  }

  public async put<T = any>(
    path: string,
    data: object = {},
    options: IHttpServiceRequestOptions = {}
  ): Promise<IHttpServiceResponse<T>> {
    return this.getResponse<T>(axios.put(path, data, this.getConfigs(options)));
  }

  public async delete<T = any>(
    path: string,
    options: IHttpServiceRequestOptions = {}
  ): Promise<IHttpServiceResponse<T>> {
    return this.getResponse<T>(axios.delete(path, this.getConfigs(options)));
  }

  private getConfigs(options: object = {}): IHttpServiceRequestOptions {
    const extraHeaders = {
      headers: {
        [HEADER_REQ_ID]: ClsServiceManager.getClsService().getId() ?? v4(),
      },
    };

    return merge({}, this.options, extraHeaders, options);
  }

  private async getResponse<T>(result: Promise<AxiosResponse>): Promise<IHttpServiceResponse> {
    const { status, statusText, headers, data } = await result;

    return {
      status,
      statusText,
      headers: JSON.parse(JSON.stringify(headers)),
      data: camelcaseKeys(data, { deep: true }) as T,
    };
  }
}
