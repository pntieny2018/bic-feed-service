import { Module } from '@nestjs/common';
import { GroupService } from '@app/service/group/src/group.service';

@Module({
  imports: [],
  providers: [GroupService],
  exports: [GroupService],
})
export class GroupModule {}
