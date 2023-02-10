import { Module, Provider } from '@nestjs/common';
import { RedisModule } from '../../../libs/redis/src';
import { GroupApplicationService, GROUP_APPLICATION_TOKEN } from './application';
import { GROUP_REPOSITORY_TOKEN } from './domain/repositoty-interface/group.repository.interface';
import { GroupRepository } from './driven-adapter/repository/group.repository';

const infrastructure: Provider[] = [
  {
    provide: GROUP_REPOSITORY_TOKEN,
    useClass: GroupRepository,
  },
];

const application = [
  {
    provide: GROUP_APPLICATION_TOKEN,
    useClass: GroupApplicationService,
  },
];

@Module({
  imports: [RedisModule],
  controllers: [],
  providers: [...infrastructure, ...application],
  exports: [GROUP_APPLICATION_TOKEN],
})
export class GroupModuleV2 {}
