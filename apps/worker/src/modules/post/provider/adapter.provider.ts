import { KAFKA_ADAPTER, QUEUE_ADAPTER } from '../domain/infra-adapter-interface';
import { USER_ADAPTER } from '../domain/service-adapter-interface';
import { KafkaAdapter, QueueAdapter } from '../driven-adapter/infra';
import { UserAdapter } from '../driven-adapter/service';

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
];
