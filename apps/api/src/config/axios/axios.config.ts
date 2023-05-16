import { IAxiosConfig } from './axios.interface';

export const getAxiosConfig = (): IAxiosConfig => ({
  group: {
    baseUrl: process.env.BE_GROUP_API_ENDPOINT,
    maxRedirects: 5,
    timeout: 10000,
  },
  upload: {
    baseUrl: process.env.UPLOAD_ENDPOINT,
    maxRedirects: 5,
    timeout: 10000,
  },
});
