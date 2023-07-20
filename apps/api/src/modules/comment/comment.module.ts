import { forwardRef, Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { MentionModule } from '../mention';
import { PostModule } from '../post';
import { AuthorityModule } from '../authority';
import { MediaModule } from '../media';
import { ReactionModule } from '../reaction';
import { FollowModule } from '../follow';
import { GiphyModule } from '../giphy';
import { UserModuleV2 } from '../v2-user/user.module';

@Module({
  imports: [
    AuthorityModule,
    FollowModule,
    forwardRef(() => PostModule),
    UserModuleV2,
    MentionModule,
    MediaModule,
    ReactionModule,
    GiphyModule,
  ],
  providers: [CommentService],
  exports: [CommentService],
})
export class CommentModule {}
