import { ModuleMetadata } from '@nestjs/common';

export interface IHttpServiceRequestOptions {
  headers?: Record<string, string>;
  params?: object;
  maxRedirects?: number;
  timeout?: number;
}

export interface IHttpServiceOptions extends IHttpServiceRequestOptions {
  baseURL: string;
  version?: string;
}

export interface IHttpServiceResponse<T = any> {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: T;
}

export interface IHttpDALModuleOptions extends Pick<ModuleMetadata, 'imports'> {
  provide: string;
  useFactory?: (...args: any[]) => IHttpServiceOptions;
  inject?: any[];
}

export interface IHttpService {
  get<T = any>(
    path: string,
    params?: object,
    options?: IHttpServiceRequestOptions
  ): Promise<IHttpServiceResponse<T>>;

  post<T = any>(
    path: string,
    data?: object,
    options?: IHttpServiceRequestOptions
  ): Promise<IHttpServiceResponse<T>>;

  put<T = any>(
    path: string,
    data?: object,
    options?: IHttpServiceRequestOptions
  ): Promise<IHttpServiceResponse<T>>;

  delete<T = any>(
    path: string,
    options?: IHttpServiceRequestOptions
  ): Promise<IHttpServiceResponse<T>>;
}
