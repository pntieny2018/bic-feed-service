import { Module } from '@nestjs/common';
import { FollowService } from './follow.service';
import { FollowController } from './follow.controller';
import { InternalFollowController } from './internal-follow.controller';

@Module({
  exports: [FollowService],
  imports: [],
  providers: [FollowService],
  controllers: [FollowController, InternalFollowController],
})
export class FollowModule {}
