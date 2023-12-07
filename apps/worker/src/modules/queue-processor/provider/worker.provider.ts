import { QueueName } from '@libs/infra/v2-queue';

import { WorkerAdapters } from '../interface';

import {
  CONTENT_SCHEDULED_PROCESSOR_TOKEN,
  QUIZ_PARTICIPANT_PROCESSOR_TOKEN,
  QUIZ_PENDING_PROCESSOR_TOKEN,
} from './processor.provider';

export const CONTENT_SCHEDULED_WORKER_TOKEN = 'CONTENT_SCHEDULED_WORKER_TOKEN';
export const QUIZ_PENDING_WORKER_TOKEN = 'QUIZ_PENDING_WORKER_TOKEN';
export const QUIZ_PARTICIPANT_WORKER_TOKEN = 'QUIZ_PARTICIPANT_WORKER_TOKEN';

export const WORKER_ADAPTER_SERVICES: WorkerAdapters[] = [
  {
    queueName: QueueName.CONTENT_SCHEDULED,
    workerToken: CONTENT_SCHEDULED_WORKER_TOKEN,
    processorToken: CONTENT_SCHEDULED_PROCESSOR_TOKEN,
    groupConcurrency: {
      concurrency: parseInt(process.env.CONTENT_SCHEDULED_GROUP_CONCURRENCY) | 2,
    },
    concurrency: parseInt(process.env.CONTENT_SCHEDULED_CONCURRENCY) | 5,
  },
  {
    queueName: QueueName.QUIZ_PENDING,
    workerToken: QUIZ_PENDING_WORKER_TOKEN,
    processorToken: QUIZ_PENDING_PROCESSOR_TOKEN,
    groupConcurrency: {
      /**
       * @note OpenAI limitation
       */
      limit: {
        max: 3,
        duration: 1000,
      },
    },
    concurrency: parseInt(process.env.QUIZ_PENDING_CONCURRENCY) | 1,
  },
  {
    queueName: QueueName.QUIZ_PARTICIPANT_RESULT,
    workerToken: QUIZ_PARTICIPANT_WORKER_TOKEN,
    processorToken: QUIZ_PARTICIPANT_PROCESSOR_TOKEN,
    groupConcurrency: {
      concurrency: parseInt(process.env.QUIZ_PARTICIPANT_GROUP_CONCURRENCY) | 1,
    },
    concurrency: parseInt(process.env.QUIZ_PARTICIPANT_CONCURRENCY) | 5,
  },
];
