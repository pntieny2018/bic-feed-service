import { PostModule } from '../post';
import { FollowModule } from '../follow';
import { CommentModule } from '../comment';
import { UserModule } from '../../shared/user';
import { GroupModule } from '../../shared/group';
import { forwardRef, Module } from '@nestjs/common';
import { ReactionService } from './reaction.service';
import { NotificationModule } from '../../notification';
import { ReactionController } from './reaction.controller';
import { ReactionCountModule } from '../../shared/reaction-count';
import { ReactionActivityService } from '../../notification/activities';

@Module({
  imports: [
    FollowModule,
    UserModule,
    GroupModule,
    NotificationModule,
    ReactionCountModule,
    forwardRef(() => PostModule),
    forwardRef(() => CommentModule),
  ],

  controllers: [ReactionController],
  providers: [ReactionService, ReactionActivityService],
  exports: [ReactionService, ReactionActivityService],
})
export class ReactionModule {}
