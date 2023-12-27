import { UserModule as LibUserModule } from '@libs/service/user';
import { forwardRef, Module } from '@nestjs/common';

import { AuthorityModule } from '../authority';
import { FollowModule } from '../follow';
import { GiphyModule } from '../giphy';
import { MediaModule } from '../media';
import { MentionModule } from '../mention';
import { PostModule } from '../post';
import { ReactionModule } from '../reaction';

import { CommentService } from './comment.service';

@Module({
  imports: [
    AuthorityModule,
    FollowModule,
    forwardRef(() => PostModule),
    MentionModule,
    MediaModule,
    ReactionModule,
    GiphyModule,
    LibUserModule,
  ],
  providers: [CommentService],
  exports: [CommentService],
})
export class CommentModule {}
