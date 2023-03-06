import { MentionModule } from '../mention/mention.module';
import { GroupModule } from '../../shared/group/group.module';
import { PostModule } from '../post/post.module';
import { forwardRef, Module } from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { ReactionModule } from '../reaction';
import { UserModuleV2 } from '../v2-user/user.module';

@Module({
  imports: [
    UserModuleV2,
    forwardRef(() => PostModule),
    GroupModule,
    MentionModule,
    forwardRef(() => ReactionModule),
  ],
  providers: [FeedService],
  controllers: [FeedController],
  exports: [FeedService],
})
export class FeedModule {}
