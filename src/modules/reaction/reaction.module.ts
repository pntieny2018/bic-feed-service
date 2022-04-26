import { forwardRef, Module } from '@nestjs/common';
import { DatabaseModule } from '../../database';
import { NotificationModule } from '../../notification';
import { GroupModule } from '../../shared/group';
import { UserModule } from '../../shared/user';
import { ReactionController } from './reaction.controller';
import { ReactionService } from './reaction.service';
import { PostModule } from '../post';
import { CommentModule } from '../comment';
import { ReactionActivityService } from '../../notification/activities/reaction-activity.service';

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
  providers: [ReactionService, ReactionActivityService],
  exports: [ReactionService, ReactionActivityService],
})
export class ReactionModule {}
