import {
  QUIZ_PARTICIPANT_SERVICE_TOKEN,
  QUIZ_PENDING_SERVICE_TOKEN,
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
];
