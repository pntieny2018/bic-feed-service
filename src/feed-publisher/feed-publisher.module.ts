import { Module } from '@nestjs/common';
import { FeedPublisherService } from './feed-publisher.service';

@Module({
  providers: [FeedPublisherService]
})
export class FeedPublisherModule {}
