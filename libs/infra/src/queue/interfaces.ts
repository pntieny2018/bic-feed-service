import { JobId, JobOptions } from 'bull';

export interface Queue {
  name: string;
}

export interface Job<T> {
  id?: JobId;
  name: string;
  data: T;
  opts: JobOptions;
  queue: Queue;
}

export interface IQueueService {
  addBulkJobs<T>(jobs: Job<T>[]): Promise<void>;
  getJobById<T>(queueName: string, jobId: JobId): Promise<Job<T>>;
  killJob(queueName: string, jobId: JobId): Promise<void>;
}
