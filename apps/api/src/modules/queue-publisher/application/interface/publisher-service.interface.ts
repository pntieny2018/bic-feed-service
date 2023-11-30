import { QueueName } from '@libs/infra/v2-queue';
import { Job } from 'bullmq';

import { JobWithConfiguration } from '../../domain/interface';

export const APPLICATION_PUBLISHER_SERVICE = 'APPLICATION_PUBLISHER_SERVICE';

export interface IAppPublisherService {
  addJob<T>(queue: QueueName, job: JobWithConfiguration<T>): Promise<void>;
  addBulkJobs<T>(queue: QueueName, jobs: JobWithConfiguration<T>[]): Promise<void>;
  getJob<T>(queue: QueueName, jobId: string): Promise<Job<T>>;
  removeJob(queue: QueueName, jobId: string): Promise<boolean>;
}
