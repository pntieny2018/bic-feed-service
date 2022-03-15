import { Module } from '@nestjs/common';
import { GroupService } from './group.service';
import { RedisModule } from '@app/redis';

@Module({
  imports: [RedisModule],
  providers: [GroupService],
  exports: [GroupService],
})
export class GroupModule {}
