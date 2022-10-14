import { forwardRef, Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { MentionModule } from '../mention';
import { UserModule } from '../../shared/user';
import { PostModule } from '../post';
import { AuthorityModule } from '../authority';
import { MediaModule } from '../media';
import { GroupModule } from '../../shared/group';
import { ReactionModule } from '../reaction';
import { FollowModule } from '../follow';
import { GiphyModule } from '../giphy';
import { CommentHistoryService } from './comment-history.service';
import { CommentAppService } from './application/comment.app-service';

@Module({
  imports: [
    AuthorityModule,
    FollowModule,
    forwardRef(() => PostModule),
    UserModule,
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
