import { Module } from '@nestjs/common';
import { ReactionService } from './reaction.service';

@Module({
  providers: [ReactionService],
  exports: [ReactionService],
})
export class ReactionModule {}
