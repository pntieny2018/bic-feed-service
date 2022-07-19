import { MentionModule } from '../mention/mention.module';
import { GroupModule } from '../../shared/group/group.module';
import { PostModule } from '../post/post.module';
import { forwardRef, Module } from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { CanReadTimelineConstraint } from './validations/decorators';
import { UserModule } from '../../shared/user';
import { ReactionModule } from '../reaction';

@Module({
  imports: [UserModule, forwardRef(() => PostModule), GroupModule, MentionModule, ReactionModule],
  providers: [FeedService, CanReadTimelineConstraint],
  controllers: [FeedController],
  exports: [FeedService],
})
export class FeedModule {}
