import { IRedisConfig } from './redis-config.interface';

export const getRedisConfig = (): IRedisConfig => ({
  db: parseInt(process.env.REDIS_DB) || 0,
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
  ssl: process.env.REDIS_SSL === 'true',
  prefix: `${process.env.REDIS_ENV}:` || '',
  env: process.env.REDIS_ENV,
});

export const getRedisContentConfig = (): IRedisConfig => ({
  db: parseInt(process.env.REDIS_CONTENT_DB) || 0,
  host: process.env.REDIS_CONTENT_HOST,
  port: parseInt(process.env.REDIS_CONTENT_PORT),
  password: process.env.REDIS_CONTENT_PASSWORD,
  ssl: process.env.REDIS_CONTENT_SSL === 'true',
  prefix: `${process.env.REDIS_CONTENT_ENV}:` || '',
  env: process.env.REDIS_CONTENT_ENV,
});
