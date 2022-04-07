import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database';
import { NotificationModule } from '../../notification';
import { GroupModule } from '../../shared/group';
import { UserModule } from '../../shared/user';
import { ReactionController } from './reaction.controller';
import { CreateReactionService, DeleteReactionService, CommonReactionService } from './services';

@Module({
  imports: [DatabaseModule, UserModule, GroupModule, NotificationModule],
  controllers: [ReactionController],
  providers: [CreateReactionService, DeleteReactionService, CommonReactionService],
  exports: [DeleteReactionService],
})
export class ReactionModule {}
