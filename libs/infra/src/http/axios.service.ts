import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export class AxiosService {
  static createAxiosInstance(config: AxiosRequestConfig): AxiosInstance {
    return axios.create(config);
  }
}
