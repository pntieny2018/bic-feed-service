import { Job } from 'bullmq';

export interface IProcessor {
  processMessage<T>(job: Job<T>): Promise<void>;
}
