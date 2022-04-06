import { MentionModule } from '../mention/mention.module';
import { GroupModule } from '../../shared/group/group.module';
import { PostModule } from '../post/post.module';
import { Module } from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { CanReadTimelineConstraint } from './validations/decorators';
import { DatabaseModule } from '../../database';
import { UserModule } from '../../shared/user';

@Module({
  imports: [DatabaseModule, UserModule, PostModule, GroupModule, MentionModule],
  providers: [FeedService, CanReadTimelineConstraint],
  controllers: [FeedController],
})
export class FeedModule {}
