import {
  IHTTPAdapterResponse,
  IHttpAdapter,
  IHTTPAdapterRequestOptions,
  IHTTPAdapterOptions,
} from '@app/infra/http';
import { Injectable } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import camelcaseKeys from 'camelcase-keys';
import { merge } from 'lodash';

@Injectable()
export class HttpAdapter implements IHttpAdapter {
  constructor(private readonly options: IHTTPAdapterOptions) {
    this.options.headers = this.options.headers || {};

    const { version } = this.options;
    if (version) {
      this.options.headers['x-version-id'] = version;
    }
  }

  public async get<T = any>(
    path: string,
    params: object = {},
    options: IHTTPAdapterRequestOptions = {}
  ): Promise<IHTTPAdapterResponse<T>> {
    return this.getResponse<T>(axios.get(path, this.getConfigs({ ...options, params })));
  }

  public async post<T = any>(
    path: string,
    data: object = {},
    options: IHTTPAdapterRequestOptions = {}
  ): Promise<IHTTPAdapterResponse<T>> {
    return this.getResponse<T>(axios.post(path, data, this.getConfigs(options)));
  }

  public async put<T = any>(
    path: string,
    data: object = {},
    options: IHTTPAdapterRequestOptions = {}
  ): Promise<IHTTPAdapterResponse<T>> {
    return this.getResponse<T>(axios.put(path, data, this.getConfigs(options)));
  }

  public async delete<T = any>(
    path: string,
    options: IHTTPAdapterRequestOptions = {}
  ): Promise<IHTTPAdapterResponse<T>> {
    return this.getResponse<T>(axios.delete(path, this.getConfigs(options)));
  }

  private getConfigs(options: object = {}): IHTTPAdapterRequestOptions {
    const extraHeaders = {};

    return merge({}, this.options, extraHeaders, options);
  }

  private async getResponse<T>(result: Promise<AxiosResponse>): Promise<IHTTPAdapterResponse> {
    const { status, statusText, headers, data } = await result;

    return {
      status,
      statusText,
      headers: JSON.parse(JSON.stringify(headers)),
      data: camelcaseKeys(data, { deep: true }) as T,
    };
  }
}
