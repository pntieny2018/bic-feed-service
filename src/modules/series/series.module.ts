import { forwardRef, Module } from '@nestjs/common';
import { SeriesService } from './series.service';
import { SeriesController } from './series.controller';
import { AuthorityModule, AuthorityService } from '../authority';
import { CommentModule } from '../comment';
import { ReactionModule } from '../reaction';
import { FeedModule } from '../feed';
import { PostModule } from '../post';
import { PostBindingService } from '../post/post-binding.service';
import { UserModule } from '../../shared/user';
import { GroupModule } from '../../shared/group';
import { SeriesAppService } from './application/series.app-service';

@Module({
  imports: [
    AuthorityModule,
    PostModule,
    UserModule,
    GroupModule,
    forwardRef(() => ReactionModule),
    forwardRef(() => CommentModule),
    forwardRef(() => FeedModule),
  ],
  controllers: [SeriesController],
  providers: [SeriesService, SeriesAppService],
  exports: [SeriesService],
})
export class SeriesModule {}
