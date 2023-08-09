export interface IHTTPAdapterRequestOptions {
  headers?: Record<string, string>;
  params?: object;
  maxRedirects?: number;
  timeout?: number;
}

export interface IHTTPAdapterOptions extends IHTTPAdapterRequestOptions {
  baseURL: string;
  version?: string;
}

export interface IHTTPAdapterResponse<T = any> {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: T;
}

export interface IHttpAdapter {
  get<T = any>(
    path: string,
    params?: object,
    options?: IHTTPAdapterRequestOptions
  ): Promise<IHTTPAdapterResponse<T>>;

  post<T = any>(
    path: string,
    data?: object,
    options?: IHTTPAdapterRequestOptions
  ): Promise<IHTTPAdapterResponse<T>>;

  put<T = any>(
    path: string,
    data?: object,
    options?: IHTTPAdapterRequestOptions
  ): Promise<IHTTPAdapterResponse<T>>;

  delete<T = any>(
    path: string,
    options?: IHTTPAdapterRequestOptions
  ): Promise<IHTTPAdapterResponse<T>>;
}
