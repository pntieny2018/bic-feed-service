import { Module } from '@nestjs/common';

import { AuthorityModule } from '../authority';
import { CommentModule } from '../comment';
import { PostModule } from '../post';

import { SeriesAppService } from './application/series.app-service';
import { SeriesController } from './series.controller';
import { SeriesService } from './series.service';

@Module({
  imports: [AuthorityModule, PostModule, CommentModule],
  controllers: [SeriesController],
  providers: [SeriesService, SeriesAppService],
  exports: [SeriesService],
})
export class SeriesModule {}
