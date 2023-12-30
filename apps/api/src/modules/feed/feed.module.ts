import { GroupModule } from '@libs/service/group';
import { UserModule as LibUserModule } from '@libs/service/user';
import { Module } from '@nestjs/common';

import { AuthorityModule } from '../authority';
import { FeedPublisherService } from '../feed-publisher';
import { FollowModule } from '../follow';
import { MentionModule } from '../mention/mention.module';
import { PostModule } from '../post/post.module';

import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';

@Module({
  imports: [LibUserModule, PostModule, GroupModule, MentionModule, AuthorityModule, FollowModule],
  providers: [FeedService, FeedPublisherService],
  controllers: [FeedController],
  exports: [FeedService, FeedPublisherService],
})
export class FeedModule {}
