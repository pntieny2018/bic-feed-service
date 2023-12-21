import {
  QUIZ_PARTICIPANT_SERVICE_TOKEN,
  QUIZ_PENDING_SERVICE_TOKEN,
  PUBLISH_REMOVE_CONTENT_SERVICE_TOKEN,
  QueueName,
} from '@libs/infra/v2-queue';

import { QueueAdapters } from '../domain/infra-interface';

export const QUEUE_ADAPTER_SERVICES: QueueAdapters[] = [
  {
    queueName: QueueName.QUIZ_PENDING,
    serviceToken: QUIZ_PENDING_SERVICE_TOKEN,
  },
  {
    queueName: QueueName.QUIZ_PARTICIPANT_RESULT,
    serviceToken: QUIZ_PARTICIPANT_SERVICE_TOKEN,
  },
  {
    queueName: QueueName.PUBLISH_OR_REMOVE_CONTENT_TO_NEWSFEED,
    serviceToken: PUBLISH_REMOVE_CONTENT_SERVICE_TOKEN,
  },
];
