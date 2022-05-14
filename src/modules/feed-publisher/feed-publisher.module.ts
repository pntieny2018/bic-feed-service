import { Module } from '@nestjs/common';
import { FeedPublisherService } from './feed-publisher.service';
import { FollowModule } from '../follow';

@Module({
  imports: [FollowModule],
  providers: [FeedPublisherService],
  exports: [FeedPublisherService],
})
export class FeedPublisherModule {}
