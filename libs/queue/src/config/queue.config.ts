import { IQueueConfig } from '@app/queue/config/queue-config.interface';

export const getQueueConfig = (): IQueueConfig => ({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
  ssl: process.env.REDIS_SSL === 'true',
  prefix: `bull:${process.env.REDIS_ENV}`,
});
