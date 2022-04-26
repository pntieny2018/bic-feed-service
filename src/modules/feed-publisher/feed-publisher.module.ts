import { Module } from '@nestjs/common';
import { FeedPublisherService } from './feed-publisher.service';
import { FollowModule } from '../follow';
import { DatabaseModule } from '../../database';

@Module({
  imports: [FollowModule, DatabaseModule],
  providers: [FeedPublisherService],
  exports: [FeedPublisherService],
})
export class FeedPublisherModule {}
