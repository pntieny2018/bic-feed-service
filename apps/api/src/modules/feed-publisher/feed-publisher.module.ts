import { Module } from '@nestjs/common';

import { FollowModule } from '../follow';

import { FeedPublisherService } from './feed-publisher.service';

@Module({
  imports: [FollowModule],
  controllers: [],
  providers: [FeedPublisherService],
  exports: [FeedPublisherService],
})
export class FeedPublisherModule {}
