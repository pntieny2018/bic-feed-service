import { QUEUE_ADAPTER } from '../domain/infra-adapter-interface';
import { USER_ADAPTER } from '../domain/service-adapter-interface ';
import { GROUP_ADAPTER } from '../domain/service-adapter-interface /group-adapter.interface';
import { QueueAdapter } from '../driven-adapter/infra/queue.adapter';
import { GroupAdapter } from '../driven-adapter/service/group.adapter';
import { UserAdapter } from '../driven-adapter/service/user.adapter';

export const adapterProvider = [
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
