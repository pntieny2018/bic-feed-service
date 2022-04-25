import { forwardRef, Module } from '@nestjs/common';
import { DatabaseModule } from '../../database';
import { NotificationModule } from '../../notification';
import { GroupModule } from '../../shared/group';
import { UserModule } from '../../shared/user';
import { ReactionController } from './reaction.controller';
import { ReactionService } from './reaction.service';
import { PostModule } from '../post';
import { CommentModule } from '../comment';
import { ReactionNotificationService } from './reaction-notification.service';

@Module({
  imports: [
    DatabaseModule,
    UserModule,
    GroupModule,
    forwardRef(() => PostModule),
    forwardRef(() => CommentModule),
    NotificationModule,
  ],
  controllers: [ReactionController],
  providers: [ReactionService, ReactionNotificationService],
  exports: [ReactionService, ReactionNotificationService],
})
export class ReactionModule {}
