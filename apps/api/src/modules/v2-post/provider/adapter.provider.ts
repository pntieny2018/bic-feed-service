import { KAFKA_ADAPTER, QUEUE_ADAPTER, EVENT_ADAPTER } from '../domain/infra-adapter-interface';
import {
  USER_ADAPTER,
  GROUP_ADAPTER,
  MEDIA_ADAPTER,
  NOTIFICATION_ADAPTER,
} from '../domain/service-adapter-interface';
import { OPEN_AI_ADAPTER } from '../domain/service-adapter-interface/openai-adapter.interface';
import { KafkaAdapter, QueueAdapter, EventAdapter } from '../driven-adapter/infra';
import {
  GroupAdapter,
  MediaAdapter,
  NotificationAdapter,
  OpenAIAdapter,
  UserAdapter,
} from '../driven-adapter/service';

export const adapterProvider = [
  {
    provide: EVENT_ADAPTER,
    useClass: EventAdapter,
  },
  {
    provide: KAFKA_ADAPTER,
    useClass: KafkaAdapter,
  },
  {
    provide: QUEUE_ADAPTER,
    useClass: QueueAdapter,
  },
  {
    provide: GROUP_ADAPTER,
    useClass: GroupAdapter,
  },
  {
    provide: MEDIA_ADAPTER,
    useClass: MediaAdapter,
  },
  {
    provide: NOTIFICATION_ADAPTER,
    useClass: NotificationAdapter,
  },
  {
    provide: OPEN_AI_ADAPTER,
    useClass: OpenAIAdapter,
  },
  {
    provide: USER_ADAPTER,
    useClass: UserAdapter,
  },
];
