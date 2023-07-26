import { IQueueConfig } from '@app/queue/config/queue-config.interface';
import { getQueueConfig } from '@app/queue/config/queue.config';

interface IConfiguration {
  queue: IQueueConfig;
}

export const configs = (): IConfiguration => ({
  queue: getQueueConfig(),
});
