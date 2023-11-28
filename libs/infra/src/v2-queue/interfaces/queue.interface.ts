import { Job } from 'bullmq';

import { JobsProOptions, QueueProOptions } from '../shared';

export interface IQueueServiceConfig {
  queueName: string;
  queueConfig: QueueProOptions;
}

export interface IQueueService {
  add<T>(job: T, opts?: JobsProOptions): Promise<void>;
  get<T>(jobId: string): Promise<Job<T>>;
  remove(jobId: string): Promise<boolean>;
  close(): Promise<void>;
}
