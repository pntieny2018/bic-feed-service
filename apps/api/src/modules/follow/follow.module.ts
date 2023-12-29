import { Module } from '@nestjs/common';

import { FollowController } from './follow.controller';
import { FollowService } from './follow.service';

@Module({
  exports: [FollowService],
  imports: [],
  providers: [FollowService],
  controllers: [FollowController],
})
export class FollowModule {}
