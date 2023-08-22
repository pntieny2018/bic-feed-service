import { RedisModule } from '@app/redis';
import { HttpModule } from '@libs/infra/http';
import { Module } from '@nestjs/common';

import { UserService } from './src/user.service';
import { USER_SERVICE_TOKEN } from './src/user.service.interface';

@Module({
  imports: [RedisModule, HttpModule], // TODO: refactor using RedisModule in libs/infra/redis
  providers: [{ provide: USER_SERVICE_TOKEN, useClass: UserService }],
  exports: [USER_SERVICE_TOKEN],
})
export class UserModule {}
