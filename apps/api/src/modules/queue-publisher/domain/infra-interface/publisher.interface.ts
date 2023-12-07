import { JobWithConfiguration } from '@libs/infra/v2-queue';

export const CONTENT_SCHEDULED_PUBLISHER_TOKEN = 'CONTENT_SCHEDULED_PUBLISHER_TOKEN';

export interface IPublisher {
  has(jobId: string): Promise<boolean>;
  add<T>(job: JobWithConfiguration<T>): Promise<void>;
  addBulk<T>(jobs: JobWithConfiguration<T>[]): Promise<void>;
  remove(jobId: string): Promise<boolean>;
}
