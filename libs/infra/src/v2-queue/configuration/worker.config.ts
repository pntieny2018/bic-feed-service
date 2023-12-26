import { IRedisConfig } from '@libs/common/config/redis';

import { IGroupConcurrency } from '../interfaces';
import { WorkerProOptions } from '../shared';

import { getQueueConfig } from './queue.config';

export const getWorkerConfig = (
  redisConfig: IRedisConfig,
  groupConcurrency: IGroupConcurrency,
  concurrency: number
): WorkerProOptions => {
  const queueConfig = getQueueConfig(redisConfig);
  delete queueConfig.defaultJobOptions;

  return {
    ...queueConfig,
    group: groupConcurrency,
    concurrency,
  };
};
