import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database';
import { FollowService } from './follow.service';
import { FollowController } from './follow.controller';
import { InternalFollowController } from './internal-follow.controller';

@Module({
  exports: [FollowService],
  imports: [DatabaseModule],
  providers: [FollowService],
  controllers: [FollowController, InternalFollowController],
})
export class FollowModule {}
