import { forwardRef, Module } from '@nestjs/common';

import { AuthorityModule } from '../authority';
import { FollowModule } from '../follow';
import { GiphyModule } from '../giphy';
import { MediaModule } from '../media';
import { MentionModule } from '../mention';
import { PostModule } from '../post';
import { ReactionModule } from '../reaction';
import { UserModuleV2 } from '../v2-user/user.module';

import { CommentService } from './comment.service';

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
