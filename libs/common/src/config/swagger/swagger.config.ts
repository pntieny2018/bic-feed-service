import { ISwaggerConfig } from './swagger-config.interface';

export const getSwaggerConfig = (): ISwaggerConfig => ({
  enable: process.env.SWAGGER_ENABLE === 'true',
  title: process.env.SWAGGER_TITLE || 'Bein Feed API Document',
  path: process.env.SWAGGER_PATH || 'api/v1',
  apiBasePath: process.env.SWAGGER_BASE_PATH || 'api/v1',
  version: process.env.SWAGGER_VERSION || '1.0.0',
  description: process.env.SWAGGER_DESCRIPTION || 'Bein Feed API Document',
});
