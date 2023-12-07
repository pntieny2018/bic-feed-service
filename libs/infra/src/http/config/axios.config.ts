import { IAxiosConfig } from '@libs/infra/http';

export const getAxiosConfig = (): IAxiosConfig => ({
  group: {
    baseUrl: process.env.BE_GROUP_API_ENDPOINT,
    maxRedirects: 5,
    timeout: 10000,
  },
  user: {
    baseUrl: process.env.BE_USER_API_ENDPOINT,
    maxRedirects: 5,
    timeout: 10000,
  },
  upload: {
    baseUrl: process.env.UPLOAD_ENDPOINT,
    maxRedirects: 5,
    timeout: 10000,
  },
  lambda: {
    baseUrl: process.env.PRIVATE_API_GATEWAY,
    maxRedirects: 5,
    timeout: 15000,
  },
  notification: {
    baseUrl: process.env.BE_NOTIFICATION_API_ENDPOINT,
    maxRedirects: 5,
    timeout: 10000,
  },
});