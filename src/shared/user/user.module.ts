import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { RedisModule } from '@app/redis';

@Module({
  imports: [RedisModule],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
