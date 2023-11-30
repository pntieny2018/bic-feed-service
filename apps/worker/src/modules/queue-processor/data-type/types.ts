import { IGroupConcurrency, QueueName } from '@libs/infra/v2-queue';

/**
 * @const CONCURRENCY
 * @default 1
 * Maximum number of jobs to process in parallel per worker instance
 *
 * @const GROUP_CONCURRENCY
 * Maximum number of jobs in group to process in parallel independently
 * of the concurrency factor per worker or the number of instantiate workers
 */
export type WorkerConstants = {
  QUEUE_NAME: QueueName;
  WORKER_TOKEN: string;
  PROCESSOR_TOKEN: string;
  CONCURRENCY: number;
  GROUP_CONCURRENCY: IGroupConcurrency;
};
