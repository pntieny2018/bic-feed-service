import { JobsProOptions } from '@libs/infra/v2-queue/shared';
import { Job } from 'bullmq';

export const CONTENT_SCHEDULED_PUBLISHER_TOKEN = 'CONTENT_SCHEDULED_PUBLISHER_TOKEN';
export interface IPublisher {
  add<T>(data: T, opts?: JobsProOptions): Promise<void>;
  addBulk<T>(jobs: { data: T; opts?: JobsProOptions }[]): Promise<void>;
  get<T>(jobId: string): Promise<Job<T>>;
  remove(jobId: string): Promise<boolean>;
}
