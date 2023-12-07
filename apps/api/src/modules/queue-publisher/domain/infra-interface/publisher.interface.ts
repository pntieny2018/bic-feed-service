import { JobWithConfiguration, QueueName } from '@libs/infra/v2-queue';

export interface QueueAdapters {
  queueName: QueueName;
  serviceToken: string;
}
export interface IPublisher {
  has(jobId: string): Promise<boolean>;
  add<T>(job: JobWithConfiguration<T>): Promise<void>;
  addBulk<T>(jobs: JobWithConfiguration<T>[]): Promise<void>;
  remove(jobId: string): Promise<boolean>;
}
