import { RedisModule } from '@libs/infra/redis';
import { Module } from '@nestjs/common';

import { ReactionCountService } from './reaction-count.service';

@Module({
  imports: [RedisModule],
  providers: [ReactionCountService],
  exports: [ReactionCountService],
})
export class ReactionCountModule {}
