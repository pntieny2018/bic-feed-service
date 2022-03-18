import { Module } from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { DatabaseModule } from 'src/database';
import { UserModule } from 'src/shared/user';
import { CanReadTimelineConstraint } from './validations/decorators';

@Module({
  imports: [DatabaseModule, UserModule],
  providers: [FeedService, CanReadTimelineConstraint],
  controllers: [FeedController],
})
export class FeedModule {}
