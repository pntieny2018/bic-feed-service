import { GroupModule } from '@libs/service/group';
import { Module } from '@nestjs/common';

import { TagService } from './tag.service';

@Module({
  imports: [GroupModule],
  controllers: [],
  providers: [TagService],
  exports: [TagService],
})
export class TagModule {}
