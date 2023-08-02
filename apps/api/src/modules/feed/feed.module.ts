import { MentionModule } from '../mention/mention.module';
import { PostModule } from '../post/post.module';
import { Module } from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { UserModuleV2 } from '../v2-user/user.module';
import { GroupModuleV2 } from '../v2-group/group.module';
import { AuthorityModule } from '../authority';

@Module({
  imports: [UserModuleV2, PostModule, GroupModuleV2, MentionModule, AuthorityModule],
  providers: [FeedService],
  controllers: [FeedController],
  exports: [FeedService],
})
export class FeedModule {}
