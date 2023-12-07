import { Module } from '@nestjs/common';
import { FollowService } from './follow.service';
import { FollowController } from './follow.controller';

@Module({
  exports: [FollowService],
  imports: [],
  providers: [FollowService],
  controllers: [FollowController],
})
export class FollowModule {}
