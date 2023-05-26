import { Module } from '@nestjs/common';
import { FeedPublisherService } from './feed-publisher.service';
import { FollowModule } from '../follow';
import { FeedConsumer } from './feed-publisher.consumer';

@Module({
  imports: [FollowModule],
  controllers: [FeedConsumer],
  providers: [FeedPublisherService],
  exports: [FeedPublisherService],
})
export class FeedPublisherModule {}
