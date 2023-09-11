import { KAFKA_ADAPTER, QUEUE_ADAPTER } from '../domain/infra-adapter-interface';
import { USER_ADAPTER, GROUP_ADAPTER, MEDIA_ADAPTER } from '../domain/service-adapter-interface';
import { KafkaAdapter, QueueAdapter } from '../driven-adapter/infra';
import { GroupAdapter } from '../driven-adapter/service/group.adapter';
import { MediaAdapter } from '../driven-adapter/service/media.adapter';
import { UserAdapter } from '../driven-adapter/service/user.adapter';

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
];
