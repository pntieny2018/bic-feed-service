import { Module } from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { DatabaseModule } from 'src/database';
import { PostModule } from '../post';
import { UserModule } from 'src/shared/user';
import { CanReadTimelineConstraint } from './validations/decorators';
import { MentionModule } from '../mention';

@Module({
  imports: [DatabaseModule, PostModule, UserModule, MentionModule],
  providers: [FeedService, CanReadTimelineConstraint],
  controllers: [FeedController],
})
export class FeedModule {}
