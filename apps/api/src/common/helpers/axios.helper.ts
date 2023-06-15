import { AxiosResponse } from 'axios';
import { ArrayHelper } from './array.helper';
import { ObjectHelper } from './object.helper';

export class AxiosHelper {
  /**
   * Get data from axios api call
   * @param response AxiosResponse
   * @return Value type of Generic T
   */
  public static getDataResponse<T>(response: AxiosResponse): T {
    if (response) {
      return typeof response.data['data'] === 'boolean'
        ? (response.data['data'] as unknown as T)
        : (ObjectHelper.convertKeysToCamelCase(response.data['data']) as unknown as T);
    }

    return null;
  }

  public static getDataArrayResponse<T>(response: AxiosResponse): T[] {
    if (response) {
      return ArrayHelper.convertObjectKeysToCamelCase(response.data['data']) as unknown as T[];
    }
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
