import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database';
import { FollowService } from './follow.service';
import { FollowController } from './follow.controller';

@Module({
  exports: [FollowService],
  imports: [DatabaseModule],
  providers: [FollowService],
  controllers: [FollowController],
})
export class FollowModule {}
