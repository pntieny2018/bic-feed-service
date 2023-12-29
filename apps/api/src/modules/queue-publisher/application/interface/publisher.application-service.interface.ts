import { JobWithConfiguration, QueueName } from '@libs/infra/v2-queue';

export const PUBLISHER_APPLICATION_SERVICE = 'PUBLISHER_APPLICATION_SERVICE';

export interface IPublisherApplicationService {
  hasJob(queue: QueueName, jobId: string): Promise<boolean>;
  addJob<T>(queue: QueueName, job: JobWithConfiguration<T>): Promise<void>;
  addBulkJobs<T>(queue: QueueName, jobs: JobWithConfiguration<T>[]): Promise<void>;
  removeJob(queue: QueueName, jobId: string): Promise<boolean>;
}
