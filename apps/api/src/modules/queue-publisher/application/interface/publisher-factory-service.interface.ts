import { QueueName } from '@libs/infra/v2-queue';
import { Job } from 'bullmq';

export const PUBLISHER_FACTORY_SERVICE = 'PUBLISHER_FACTORY_SERVICE';

/**
 * @param delay An amount of milliseconds to wait until this job can be processed.
 * @param group The unique group job will belong to and processed to group mechanics.
 * @param jobId Override the job ID - by default, the job ID is a unique integer
 */
export interface JobWithConfiguration<T> {
  data: T;
  opts: {
    delay?: number;
    group?: {
      id: string;
    };
    jobId?: string;
  };
}

export interface IPublisherFactoryService {
  addJob<T>(queue: QueueName, job: JobWithConfiguration<T>): Promise<void>;
  addBulkJobs<T>(queue: QueueName, jobs: JobWithConfiguration<T>[]): Promise<void>;
  getJob<T>(queue: QueueName, jobId: string): Promise<Job<T>>;
  removeJob(queue: QueueName, jobId: string): Promise<boolean>;
}
