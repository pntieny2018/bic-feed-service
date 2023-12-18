import {
  PUBLISH_OR_REMOVE_POST_TO_NEWSFEED_SERVICE_TOKEN,
  QueueFlowName,
} from '@libs/infra/v2-queue';

import { QueueFlowAdapters } from '../domain/infra-interface';

export const QUEUE_FLOW_ADAPTER_SERVICES: QueueFlowAdapters[] = [
  {
    flowName: QueueFlowName.PUBLISH_OR_REMOVE_POST_TO_NEWSFEED,
    serviceToken: PUBLISH_OR_REMOVE_POST_TO_NEWSFEED_SERVICE_TOKEN,
  },
];
