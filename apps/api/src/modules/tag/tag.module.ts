import { Module } from '@nestjs/common';
import { TagService } from './tag.service';
import { GroupModuleV2 } from '../v2-group/group.module';

@Module({
  imports: [GroupModuleV2],
  controllers: [],
  providers: [TagService],
  exports: [TagService],
})
export class TagModule {}
