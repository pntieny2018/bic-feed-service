import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database';
import { NotificationModule } from '../../notification';
import { GroupModule } from '../../shared/group';
import { UserModule } from '../../shared/user';
import { ReactionController } from './reaction.controller';
import {
  CommonReactionService,
  CreateOrDeleteReactionService,
  CreateReactionService,
  DeleteReactionService,
} from './services';

@Module({
  imports: [DatabaseModule, UserModule, GroupModule, NotificationModule],
  controllers: [ReactionController],
  providers: [
    CreateReactionService,
    DeleteReactionService,
    CommonReactionService,
    CreateOrDeleteReactionService,
  ],
  exports: [
    CommonReactionService,
    CreateReactionService,
    DeleteReactionService,
    CreateOrDeleteReactionService,
  ],
})
export class ReactionModule {}
