import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export class AxiosService {
  public static createAxiosInstance(config: AxiosRequestConfig): AxiosInstance {
    return axios.create(config);
  }
}
