import { forwardRef, Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { DatabaseModule } from '../../database';
import { MentionModule } from '../mention';
import { UserModule } from '../../shared/user';
import { PostModule } from '../post';
import { AuthorityModule } from '../authority';
import { MediaModule } from '../media';
import { GroupModule } from '../../shared/group';
import { ReactionModule } from '../reaction';
import { FollowModule } from '../follow';

@Module({
  imports: [
    DatabaseModule,
    AuthorityModule,
    FollowModule,
    forwardRef(() => PostModule),
    UserModule,
    MentionModule,
    MediaModule,
    GroupModule,
    ReactionModule,
  ],
  controllers: [CommentController],
  providers: [CommentService],
  exports: [CommentService],
})
export class CommentModule {}
