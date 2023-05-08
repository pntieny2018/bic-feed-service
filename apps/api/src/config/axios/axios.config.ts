import { IAxiosConfig } from './axios.interface';

export const getAxiosConfig = (): IAxiosConfig => ({
  baseUrl: process.env.BE_GROUP_API_ENDPOINT,
  maxRedirects: 5,
  timeout: 10000,
});
