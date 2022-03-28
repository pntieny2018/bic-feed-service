import { Module } from '@nestjs/common';
import { FeedPublisherService } from './feed-publisher.service';

@Module({
  providers: [FeedPublisherService],
  exports: [FeedPublisherService],
})
export class FeedPublisherModule {}
