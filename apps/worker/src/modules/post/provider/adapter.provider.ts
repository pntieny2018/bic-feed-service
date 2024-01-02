import { KAFKA_ADAPTER, QUEUE_ADAPTER } from '../domain/infra-adapter-interface';
import { GROUP_ADAPTER, USER_ADAPTER } from '../domain/service-adapter-interface';
import { KafkaAdapter, QueueAdapter } from '../driven-adapter/infra';
import { UserAdapter } from '../driven-adapter/service';
import { GroupAdapter } from '../driven-adapter/service/group.adapter';

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
];
