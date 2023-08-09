import { Module } from '@nestjs/common';
import { RedisModule } from '@app/infra/redis';
import { UserService } from '@app/service/user/src/user.service';

@Module({
  imports: [RedisModule],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
