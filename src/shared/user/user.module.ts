import { Module } from '@nestjs/common';
import { UserService } from './user.service';
//FIXME: @app/redis
import { RedisModule } from '../../../libs/redis/src';

@Module({
  imports: [RedisModule],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
