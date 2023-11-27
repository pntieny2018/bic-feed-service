import { Job } from 'bullmq';

import { QueueProOptions } from '../shared';

export interface IQueueServiceConfig {
  queueName: string;
  queueConfig: QueueProOptions;
}

export interface IQueueService {
  add<T>(data: T, groupId?: string): Promise<void>;
  get<T>(jobId: string): Promise<Job<T>>;
  remove(jobId: string): Promise<boolean>;
  close(): Promise<void>;
}
