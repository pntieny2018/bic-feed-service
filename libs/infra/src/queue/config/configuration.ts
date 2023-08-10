import { IQueueConfig, getQueueConfig } from '@libs/infra/queue';

interface IConfiguration {
  queue: IQueueConfig;
}

export const configs = (): IConfiguration => ({
  queue: getQueueConfig(),
});
