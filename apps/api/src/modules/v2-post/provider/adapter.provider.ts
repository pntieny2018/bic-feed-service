import { EVENT_ADAPTER, KAFKA_ADAPTER, QUEUE_ADAPTER } from '../domain/infra-adapter-interface';
import { USER_ADAPTER, GROUP_ADAPTER, MEDIA_ADAPTER } from '../domain/service-adapter-interface';
import { OPEN_AI_ADAPTER } from '../domain/service-adapter-interface/openai-adapter.interface';
import { EventAdapter, KafkaAdapter, QueueAdapter } from '../driven-adapter/infra';
import { GroupAdapter, MediaAdapter, OpenAIAdapter, UserAdapter } from '../driven-adapter/service';

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
    provide: USER_ADAPTER,
    useClass: UserAdapter,
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
    provide: OPEN_AI_ADAPTER,
    useClass: OpenAIAdapter,
  },
];
