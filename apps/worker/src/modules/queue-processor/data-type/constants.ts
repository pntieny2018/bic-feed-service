import { CONTENT_SCHEDULED_WORKER_TOKEN, QueueName } from '@libs/infra/v2-queue';

import { CONTENT_SCHEDULED_PROCESSOR_TOKEN } from '../interface';

import { WorkerConstants } from './types';

export const WORKER_ADAPTER_SERVICES: WorkerConstants[] = [
  {
    QUEUE_NAME: QueueName.CONTENT_SCHEDULED,
    WORKER_TOKEN: CONTENT_SCHEDULED_WORKER_TOKEN,
    PROCESSOR_TOKEN: CONTENT_SCHEDULED_PROCESSOR_TOKEN,
    GROUP_CONCURRENCY: {
      concurrency: 2,
    },
    CONCURRENCY: 2,
  },
];
