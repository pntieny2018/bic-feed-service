import {
  ATTACH_DETACH_NEWSFEED_SERVICE_TOKEN,
  CONTENT_SCHEDULED_SERVICE_TOKEN,
  FOLLOW_UNFOLLOW_GROUPS_SERVICE_TOKEN,
  PRODUCER_FOLLOW_UNFOLLOW_SERVICE_TOKEN,
  QueueName,
} from '@libs/infra/v2-queue';

import { QueueAdapters } from '../domain/infra-interface';

export const QUEUE_ADAPTER_SERVICES: QueueAdapters[] = [
  {
    queueName: QueueName.CONTENT_SCHEDULED,
    serviceToken: CONTENT_SCHEDULED_SERVICE_TOKEN,
  },
  {
    queueName: QueueName.FOLLOW_UNFOLLOW_GROUPS,
    serviceToken: FOLLOW_UNFOLLOW_GROUPS_SERVICE_TOKEN,
  },
  {
    queueName: QueueName.PRODUCER_FOLLOW_UNFOLLOW_GROUPS,
    serviceToken: PRODUCER_FOLLOW_UNFOLLOW_SERVICE_TOKEN,
  },
  {
    queueName: QueueName.ATTACH_DETACH_NEWSFEED,
    serviceToken: ATTACH_DETACH_NEWSFEED_SERVICE_TOKEN,
  },
];
