import { forwardRef, Module } from '@nestjs/common';
import { SeriesService } from './series.service';
import { SeriesController } from './series.controller';
import { AuthorityModule } from '../authority';
import { CommentModule } from '../comment';
import { FeedModule } from '../feed';
import { PostModule } from '../post';
import { SeriesAppService } from './application/series.app-service';
import { SearchModule } from '../search';
import { GroupModuleV2 } from '../v2-group/group.module';

@Module({
  imports: [
    AuthorityModule,
    PostModule,
    GroupModuleV2,
    SearchModule,
    forwardRef(() => CommentModule),
    forwardRef(() => FeedModule),
  ],
  controllers: [SeriesController],
  providers: [SeriesService, SeriesAppService],
  exports: [SeriesService],
})
export class SeriesModule {}
