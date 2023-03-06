import { forwardRef, Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { MentionModule } from '../mention';
import { PostModule } from '../post';
import { AuthorityModule } from '../authority';
import { MediaModule } from '../media';
import { GroupModule } from '../../shared/group';
import { ReactionModule } from '../reaction';
import { FollowModule } from '../follow';
import { GiphyModule } from '../giphy';
import { CommentHistoryService } from './comment-history.service';
import { CommentAppService } from './application/comment.app-service';
import { UserModuleV2 } from '../v2-user/user.module';

@Module({
  imports: [
    AuthorityModule,
    FollowModule,
    forwardRef(() => PostModule),
    UserModuleV2,
    MentionModule,
    MediaModule,
    GroupModule,
    ReactionModule,
    GiphyModule,
  ],
  controllers: [CommentController],
  providers: [CommentService, CommentHistoryService, CommentAppService],
  exports: [CommentService, CommentHistoryService],
})
export class CommentModule {}
