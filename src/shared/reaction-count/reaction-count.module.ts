import { Module } from '@nestjs/common';
import { RedisModule } from '@app/redis';
import { ReactionCountService } from './reaction-count.service';

@Module({
  imports: [RedisModule],
  providers: [ReactionCountService],
  exports: [ReactionCountService],
})
export class ReactionCountModule {}
