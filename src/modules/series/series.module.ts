import { forwardRef, Module } from '@nestjs/common';
import { SeriesService } from './series.service';
import { SeriesController } from './series.controller';
import { AuthorityModule } from '../authority';
import { CommentModule } from '../comment';
import { ReactionModule } from '../reaction';
import { FeedModule } from '../feed';
import { PostModule } from '../post';
import { GroupModule } from '../../shared/group';
import { SeriesAppService } from './application/series.app-service';
import { ArticleModule } from '../article';
import { SearchModule } from '../search';

@Module({
  imports: [
    AuthorityModule,
    PostModule,
    GroupModule,
    SearchModule,
    forwardRef(() => ReactionModule),
    forwardRef(() => CommentModule),
    forwardRef(() => FeedModule),
    forwardRef(() => ArticleModule),
  ],
  controllers: [SeriesController],
  providers: [SeriesService, SeriesAppService],
  exports: [SeriesService],
})
export class SeriesModule {}
