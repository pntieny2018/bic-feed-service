import { IRedisConfig } from './redis-config.interface';

export const getRedisConfig = (): IRedisConfig => ({
  db: parseInt(process.env.REDIS_DB) || 0,
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
  ssl: process.env.REDIS_SSL === 'true',
  prefix: `${process.env.REDIS_ENV}:` || '',
});
