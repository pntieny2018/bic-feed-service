import { IGroupConcurrency, QueueName } from '@libs/infra/v2-queue';
import { Job } from 'bullmq';

/**
 * @const concurrency
 * @default 1
 * Maximum number of jobs to process in parallel per worker instance
 *
 * @const groupConcurrency
 * Maximum number of jobs in group to process in parallel independently
 * of the concurrency factor per worker or the number of instantiate workers
 */
export interface WorkerAdapters {
  queueName: QueueName;
  workerToken: string;
  processorToken: string;
  concurrency: number;
  groupConcurrency: IGroupConcurrency;
}

export interface IProcessor {
  processMessage(job: Job): Promise<void>;
}
