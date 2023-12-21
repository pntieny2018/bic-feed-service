import { QueueName } from '@libs/infra/v2-queue';

import { WorkerAdapters } from '../driving-apdater/queue-processor/interface';

import {
  CONTENT_SCHEDULED_PROCESSOR_TOKEN,
  FOLLOW_UNFOLLOW_GROUPS_PROCESSOR_TOKEN,
  PUBLISH_REMOVE_CONTENT_PROCESSOR_TOKEN,
  QUIZ_PARTICIPANT_PROCESSOR_TOKEN,
  QUIZ_PENDING_PROCESSOR_TOKEN,
} from './processor.provider';

export const CONTENT_SCHEDULED_WORKER_TOKEN = 'CONTENT_SCHEDULED_WORKER_TOKEN';
export const QUIZ_PENDING_WORKER_TOKEN = 'QUIZ_PENDING_WORKER_TOKEN';
export const QUIZ_PARTICIPANT_WORKER_TOKEN = 'QUIZ_PARTICIPANT_WORKER_TOKEN';
export const PUBLISH_REMOVE_CONTENT_WORKER_TOKEN = 'PUBLISH_REMOVE_CONTENT_WORKER_TOKEN';
export const FOLLOW_UNFOLLOW_GROUPS_WORKER_TOKEN = 'FOLLOW_UNFOLLOW_GROUPS_WORKER_TOKEN';

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
      concurrency: parseInt(process.env.QUIZ_PARTICIPANT_GROUP_CONCURRENCY) | 2,
    },
    concurrency: parseInt(process.env.QUIZ_PARTICIPANT_CONCURRENCY) | 5,
  },
  {
    queueName: QueueName.PUBLISH_OR_REMOVE_CONTENT_TO_NEWSFEED,
    workerToken: PUBLISH_REMOVE_CONTENT_WORKER_TOKEN,
    processorToken: PUBLISH_REMOVE_CONTENT_PROCESSOR_TOKEN,
    groupConcurrency: {
      concurrency: 1,
    },
    concurrency: parseInt(process.env.PUBLISH_REMOVE_CONTENT_CONCURRENCY) | 50,
  },
  {
    queueName: QueueName.FOLLOW_UNFOLLOW_GROUPS,
    workerToken: FOLLOW_UNFOLLOW_GROUPS_WORKER_TOKEN,
    processorToken: FOLLOW_UNFOLLOW_GROUPS_PROCESSOR_TOKEN,
    groupConcurrency: {
      concurrency: 1,
    },
    concurrency: parseInt(process.env.FOLLOW_UNFOLLOW_GROUPS_CONCURRENCY) | 50,
  },
];
