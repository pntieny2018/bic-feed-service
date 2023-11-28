import { IRedisConfig } from '@libs/common/config/redis';

import { WorkerProOptions } from '../shared';

import { getQueueConfig } from './queue.config';

export const getWorkerConfig = (
  redisConfig: IRedisConfig,
  concurrency: number
): WorkerProOptions => {
  const queueConfig = getQueueConfig(redisConfig);
  delete queueConfig.defaultJobOptions;

  return {
    ...queueConfig,
    concurrency,
  };
};
