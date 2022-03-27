import { Module } from '@nestjs/common';
import { FeedGeneratorService } from './feed-generator.service';

@Module({
  providers: [FeedGeneratorService],
})
export class FeedGeneratorModule {}
