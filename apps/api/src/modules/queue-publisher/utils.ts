import { CONTENT_SCHEDULED_SERVICE_TOKEN, CONTENT_SCHEDULED_TOKEN, QueueName } from './data-type';

export function queueNameToToken(queueName: QueueName): string {
  switch (queueName) {
    case QueueName.CONTENT_SCHEDULED:
      return CONTENT_SCHEDULED_TOKEN;
    default:
      break;
  }
}

export function adapterServiceToQueueName(token: string): QueueName {
  switch (token) {
    case CONTENT_SCHEDULED_SERVICE_TOKEN:
      return QueueName.CONTENT_SCHEDULED;
    default:
      break;
  }
}
