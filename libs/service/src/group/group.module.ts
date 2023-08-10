import { GroupService } from '@libs/service/group/src/group.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [],
  providers: [GroupService],
  exports: [GroupService],
})
export class GroupModule {}
