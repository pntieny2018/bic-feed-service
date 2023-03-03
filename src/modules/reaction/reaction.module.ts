import { PostModule } from '../post';
import { FollowModule } from '../follow';
import { CommentModule } from '../comment';
import { GroupModule } from '../../shared/group';
import { forwardRef, Module } from '@nestjs/common';
import { ReactionService } from './reaction.service';
import { NotificationModule } from '../../notification';
import { ReactionController } from './reaction.controller';
import { ReactionCountModule } from '../../shared/reaction-count';
import { ReactionActivityService } from '../../notification/activities';
import { FeedModule } from '../feed';
import { UserModuleV2 } from '../v2-user/user.module';

@Module({
  imports: [
    FollowModule,
    UserModuleV2,
    GroupModule,
    NotificationModule,
    ReactionCountModule,
    forwardRef(() => PostModule),
    forwardRef(() => CommentModule),
    forwardRef(() => FeedModule),
  ],

  controllers: [ReactionController],
  providers: [ReactionService, ReactionActivityService],
  exports: [ReactionService, ReactionActivityService],
})
export class ReactionModule {}
