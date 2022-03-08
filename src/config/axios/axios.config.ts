import { IAxiosConfig } from './axios.interface';

export const getAxiosConfig = (): IAxiosConfig => ({
  baseUrl: process.env.BEIN_BACKEND_BASE_URL,
  maxRedirects: 5,
  timeout: 10000,
});
