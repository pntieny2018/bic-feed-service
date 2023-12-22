import { GroupService } from '@libs/service/group/src/group.service';
import { GROUP_SERVICE_TOKEN } from '@libs/service/group/src/group.service.interface';
import { Module } from '@nestjs/common';

@Module({
  providers: [
    {
      provide: GROUP_SERVICE_TOKEN,
      useClass: GroupService,
    },
  ],
  exports: [GROUP_SERVICE_TOKEN],
})
export class GroupModule {}
