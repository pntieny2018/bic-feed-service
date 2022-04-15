import { forwardRef, Module } from '@nestjs/common';
import { DatabaseModule } from '../../database';
import { NotificationModule } from '../../notification';
import { GroupModule } from '../../shared/group';
import { UserModule } from '../../shared/user';
import { CommentModule } from '../comment';
import { PostModule } from '../post';
import { ReactionController } from './reaction.controller';
import { CreateReactionService, DeleteReactionService, CommonReactionService } from './services';

@Module({
  imports: [
    DatabaseModule,
    UserModule,
    GroupModule,
    NotificationModule,
    forwardRef(() => PostModule),
    forwardRef(() => CommentModule),
  ],
  controllers: [ReactionController],
  providers: [CreateReactionService, DeleteReactionService, CommonReactionService],
  exports: [CreateReactionService, DeleteReactionService],
})
export class ReactionModule {}
