import { Module } from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { CanReadTimelineConstraint } from './validations/decorators';
import { DatabaseModule } from '../../database';
import { UserModule } from '../../shared/user';

@Module({
  imports: [DatabaseModule, UserModule],
  providers: [FeedService, CanReadTimelineConstraint],
  controllers: [FeedController],
})
export class FeedModule {}
