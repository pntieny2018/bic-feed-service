import { QueueName } from './queue.enum';

export const CONTENT_SCHEDULED_PUBLISHER_TOKEN = 'CONTENT_SCHEDULED_PUBLISHER_TOKEN';
export const CONTENT_SCHEDULED_SERVICE_TOKEN = 'CONTENT_SCHEDULED_SERVICE_TOKEN';

export type QueueConstants = {
  QUEUE_NAME: QueueName;
  SERVICE_TOKEN: string;
};

export const QUEUE_ADAPTER_SERVICES: QueueConstants[] = [
  {
    QUEUE_NAME: QueueName.CONTENT_SCHEDULED,
    SERVICE_TOKEN: CONTENT_SCHEDULED_SERVICE_TOKEN,
  },
];
