import { Module } from '@nestjs/common';

import { AuthorityModule } from '../authority';
import { FeedPublisherService } from '../feed-publisher';
import { FollowModule } from '../follow';
import { MentionModule } from '../mention/mention.module';
import { PostModule } from '../post/post.module';
import { GroupModuleV2 } from '../v2-group/group.module';
import { UserModuleV2 } from '../v2-user/user.module';

import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';

@Module({
  imports: [UserModuleV2, PostModule, GroupModuleV2, MentionModule, AuthorityModule, FollowModule],
  providers: [FeedService, FeedPublisherService],
  controllers: [FeedController],
  exports: [FeedService, FeedPublisherService],
})
export class FeedModule {}
