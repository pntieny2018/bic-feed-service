import { AxiosResponse } from 'axios';

export class AxiosHelper {
  /**
   * Get data from axios api call
   * @param response AxiosResponse
   * @return Value type of Generic T
   */
  public static getDataResponse<T>(response: AxiosResponse): T {
    if (response) {
      return response.data['data'] as T;
    }

    return null;
  }

  /**
   * Inject params to url path
   * @param path String Nodejs url path
   * @param params Record<string, any>
   * @returns url inject params
   */
  public static injectParamsToStrUrl(path: string, params: Record<string, unknown>): string {
    Object.entries(params).forEach(([k, v]) => {
      path = path.replace(`:${k}`, encodeURIComponent(<string>v));
    });
    return path;
  }
}
