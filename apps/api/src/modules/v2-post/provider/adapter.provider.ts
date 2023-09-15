import { KAFKA_ADAPTER, QUEUE_ADAPTER } from '../domain/infra-adapter-interface';
import { USER_ADAPTER, GROUP_ADAPTER, MEDIA_ADAPTER } from '../domain/service-adapter-interface';
import { KafkaAdapter, QueueAdapter } from '../driven-adapter/infra';
import { GroupAdapter, MediaAdapter, OpenAIAdapter, UserAdapter } from '../driven-adapter/service';
import { OPEN_AI_ADAPTER } from '../domain/service-adapter-interface/openai-adapter.interface';

export const adapterProvider = [
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
