import { CONTENT_SCHEDULED_SERVICE_TOKEN, QueueName } from '@libs/infra/v2-queue';

import { QueueAdapters } from '../domain/infra-interface';

export const QUEUE_ADAPTER_SERVICES: QueueAdapters[] = [
  {
    queueName: QueueName.CONTENT_SCHEDULED,
    serviceToken: CONTENT_SCHEDULED_SERVICE_TOKEN,
  },
];
