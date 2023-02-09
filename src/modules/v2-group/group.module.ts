import { Module, Provider } from '@nestjs/common';
import { GroupApplicationService } from './application/group.app-service';
import { GROUP_APPLICATION_TOKEN } from './application/group.app-service.interface';
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
  imports: [],
  controllers: [],
  providers: [...infrastructure, ...application],
})
export class PostModuleV2 {}
