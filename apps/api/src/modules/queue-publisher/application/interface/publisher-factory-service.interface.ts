import { Job } from 'bullmq';

import { QueueName } from '../../data-type';

export const PUBLISHER_FACTORY_SERVICE = 'PUBLISHER_FACTORY_SERVICE ';

export interface JobWithQueue<T> {
  queue: QueueName;
  data: { data: T };
}

/**
 * @param delay An amount of milliseconds to wait until this job can be processed.
 * @param group The unique group job will belong to and processed to group mechanics.
 * @param jobId Override the job ID - by default, the job ID is a unique integer
 */
export interface JobWithConfiguration {
  delay?: number;
  group?: {
    id: string;
  };
  jobId?: string;
}

export interface IPublisherFactoryService {
  addJob<T>(job: JobWithQueue<T>, opts?: JobWithConfiguration): Promise<void>;
  getJob<T>(queue: QueueName, jobId: string): Promise<Job<T>>;
  removeJob(queue: QueueName, jobId: string): Promise<boolean>;
}
