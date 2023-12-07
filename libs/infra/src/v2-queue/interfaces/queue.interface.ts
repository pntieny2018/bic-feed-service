import { JobsProOptions, QueueProOptions } from '../shared';

export const CONTENT_SCHEDULED_SERVICE_TOKEN = 'CONTENT_SCHEDULED_SERVICE_TOKEN';
export interface IQueueServiceConfig {
  queueName: string;
  queueConfig: QueueProOptions;
}
export interface JobWithConfiguration<T> {
  data: T;
  opts: JobsProOptions;
}

export interface IQueueService {
  add<T>(job: JobWithConfiguration<T>): Promise<void>;
  addBulk<T>(jobs: JobWithConfiguration<T>[]): Promise<void>;
  has(jobId: string): Promise<boolean>;
  remove(jobId: string): Promise<boolean>;
  close(): Promise<void>;
}
