import { QueueName } from './queue.enum';
import { QueueConstants } from './types';

export const CONTENT_SCHEDULED_PUBLISHER_TOKEN = 'CONTENT_SCHEDULED_PUBLISHER_TOKEN';
export const CONTENT_SCHEDULED_SERVICE_TOKEN = 'CONTENT_SCHEDULED_SERVICE_TOKEN';

export const QUEUE_ADAPTER_SERVICES: QueueConstants[] = [
  {
    QUEUE_NAME: QueueName.CONTENT_SCHEDULED,
    SERVICE_TOKEN: CONTENT_SCHEDULED_SERVICE_TOKEN,
  },
];
