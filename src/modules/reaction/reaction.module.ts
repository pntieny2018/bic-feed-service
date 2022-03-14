import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database';
import { ReactionController } from './reaction.controller';
import { ReactionService } from './reaction.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ReactionController],
  providers: [ReactionService],
})
export class ReactionModule {}
