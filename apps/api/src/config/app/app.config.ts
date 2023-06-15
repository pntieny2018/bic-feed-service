import { IAppConfig } from './app-config.interface';

export const getAppConfig = (): IAppConfig => ({
  name: process.env.APP_NAME || 'Bein Feed',
  version: process.env.VERSIONS_SUPPORTED || '1',
  debug: process.env.APP_DEBUG === 'true' || false,
  port: parseInt(process.env.APP_PORT, 10) || 3001,
  url: process.env.APP_URL || 'http://localhost:3001',
  env: process.env.APP_ENV || 'development',
  apiPrefix: process.env.APP_API_PREFIX || 'api',
  enableCors: process.env.APP_ENABLE_CORS === 'true',
  corsOrigin: (process.env.APP_CORS_ORIGIN ?? '').split(','),
});
