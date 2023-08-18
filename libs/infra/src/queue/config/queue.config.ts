import { JobOptions } from 'bull';

import { IQueueConfig } from './queue.config.interface';

export const getQueueConfig = (): IQueueConfig => ({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
  ssl: process.env.REDIS_SSL === 'true',
  prefix: `bull:${process.env.REDIS_ENV}`,
});

export const getDefaultJobOptions = (): JobOptions => ({
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 3000,
  },
  removeOnComplete: true,
  removeOnFail: true,
});
