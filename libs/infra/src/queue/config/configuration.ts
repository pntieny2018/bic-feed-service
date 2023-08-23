import { JobOptions } from 'bull';

import { getDefaultJobOptions, getQueueConfig } from './queue.config';
import { IQueueConfig } from './queue.config.interface';

interface IConfiguration {
  queue: IQueueConfig;
  defaultJobOptions: JobOptions;
}

export const configs = (): IConfiguration => ({
  queue: getQueueConfig(),
  defaultJobOptions: getDefaultJobOptions(),
});
