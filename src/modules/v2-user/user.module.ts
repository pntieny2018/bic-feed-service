import { Module, Provider } from '@nestjs/common';
import { UserApplicationService } from './application/user.app-service';
import { USER_APPLICATION_TOKEN } from './application/user.app-service.interface';
import { USER_REPOSITORY_TOKEN } from './domain/repositoty-interface/user.repository.interface';
import { UserRepository } from './driven-adapter/repository/user.repository';
import { RedisModule } from '@app/redis';

const infrastructure: Provider[] = [
  {
    provide: USER_REPOSITORY_TOKEN,
    useClass: UserRepository,
  },
];

const application = [
  {
    provide: USER_APPLICATION_TOKEN,
    useClass: UserApplicationService,
  },
];

@Module({
  imports: [RedisModule],
  controllers: [],
  providers: [...infrastructure, ...application],
  exports: [USER_APPLICATION_TOKEN],
})
export class UserModuleV2 {}
