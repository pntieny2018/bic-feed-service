import { Module } from '@nestjs/common';
import { GroupService } from './group.service';
import { RedisModule } from '@app/redis';
import { GroupHttpService } from './group-http.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [RedisModule, HttpModule],
  providers: [GroupService, GroupHttpService],
  exports: [GroupService, GroupHttpService],
})
export class GroupModule {}
