import { IQueueConfig, getQueueConfig } from '@app/infra/queue';

interface IConfiguration {
  queue: IQueueConfig;
}

export const configs = (): IConfiguration => ({
  queue: getQueueConfig(),
});
