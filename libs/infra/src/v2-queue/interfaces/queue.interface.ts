import { QueueProOptions } from '../shared';

export interface IQueueServiceConfig {
  queueName: string;
  queueConfig: QueueProOptions;
}

export interface IQueueService {
  add<T>(data: T, groupId?: string): Promise<void>;
  close(): Promise<void>;
}
