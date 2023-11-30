import { CONTENT_SCHEDULED_SERVICE_TOKEN, QueueName } from '@libs/infra/v2-queue';

import { QueueConstants } from './types';

export const QUEUE_ADAPTER_SERVICES: QueueConstants[] = [
  {
    QUEUE_NAME: QueueName.CONTENT_SCHEDULED,
    SERVICE_TOKEN: CONTENT_SCHEDULED_SERVICE_TOKEN,
  },
];
