import { JobWithConfiguration, QueueName } from '@libs/infra/v2-queue';

export const PUBLISHER_DOMAIN_SERVICE_TOKEN = 'PUBLISHER_DOMAIN_SERVICE_TOKEN';

export interface IPublisherDomainService {
  addJob<T>(queue: QueueName, job: JobWithConfiguration<T>): Promise<void>;
  addBulkJobs<T>(queue: QueueName, jobs: JobWithConfiguration<T>[]): Promise<void>;
}
