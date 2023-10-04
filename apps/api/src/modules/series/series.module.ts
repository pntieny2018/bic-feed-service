import { Module } from '@nestjs/common';

import { AuthorityModule } from '../authority';
import { CommentModule } from '../comment';
import { PostModule } from '../post';
import { GroupModuleV2 } from '../v2-group/group.module';

import { SeriesAppService } from './application/series.app-service';
import { SeriesController } from './series.controller';
import { SeriesService } from './series.service';

@Module({
  imports: [AuthorityModule, PostModule, GroupModuleV2, CommentModule],
  controllers: [SeriesController],
  providers: [SeriesService, SeriesAppService],
  exports: [SeriesService],
})
export class SeriesModule {}
