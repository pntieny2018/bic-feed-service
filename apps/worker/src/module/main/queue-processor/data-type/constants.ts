import { QueueName } from '.';

/**
 * @const GROUP_CONCURRENCY Maximum number of jobs in group to process in parallel independently
 * of the concurrency factor per worker or the number of workers that you instantiate in application
 */
export const CONTENT_SCHEDULED_WORKER_TOKEN = 'CONTENT_SCHEDULED_WORKER_TOKEN';

export const CONTENT_SCHEDULED_PROCESSOR_TOKEN = 'CONTENT_SCHEDULED_PROCESSOR_TOKEN';

export type WorkerConstants = {
  QUEUE_NAME: QueueName;
  WORKER_TOKEN: string;
  PROCESSOR_TOKEN: unknown;
  GROUP_CONCURRENCY: number;
};

export const WORKER_ADAPTER_SERVICES: WorkerConstants[] = [
  {
    QUEUE_NAME: QueueName.CONTENT_SCHEDULED,
    WORKER_TOKEN: CONTENT_SCHEDULED_WORKER_TOKEN,
    PROCESSOR_TOKEN: CONTENT_SCHEDULED_PROCESSOR_TOKEN,
    GROUP_CONCURRENCY: 5,
  },
];
