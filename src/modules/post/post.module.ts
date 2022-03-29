import { MediaModule } from '../media';
import { UserModule } from '../../shared/user';
import { forwardRef, Module } from '@nestjs/common';
import { DatabaseModule } from '../../database';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { MentionModule } from '../mention';
import { PostPolicyService } from './post-policy.service';
import { GroupModule } from '../../shared/group';
import { CommentModule } from '../comment';
import { AuthorityModule } from '../authority';

@Module({
  imports: [
    DatabaseModule,
    PostModule,
    UserModule,
    GroupModule,
    MediaModule,
    MentionModule,
    AuthorityModule,
    forwardRef(() => CommentModule),
  ],
  controllers: [PostController],
  providers: [PostService, PostPolicyService],
  exports: [PostService, PostPolicyService],
})
export class PostModule {}
