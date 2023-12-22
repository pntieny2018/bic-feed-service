import { Module } from '@nestjs/common';

import { UserService } from './src/user.service';
import { USER_SERVICE_TOKEN } from './src/user.service.interface';

@Module({
  providers: [{ provide: USER_SERVICE_TOKEN, useClass: UserService }],
  exports: [USER_SERVICE_TOKEN],
})
export class UserModule {}
