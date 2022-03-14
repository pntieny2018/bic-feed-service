import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database';
import { ReactionController } from './reaction.controller';
import { CreateReactionService } from './services';

@Module({
  imports: [DatabaseModule],
  controllers: [ReactionController],
  providers: [CreateReactionService],
})
export class ReactionModule {}
