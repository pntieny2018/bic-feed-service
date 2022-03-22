import { MediaModule } from '../media';
import { UserModule } from '../../shared/user';
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { MentionModule } from '../mention';
import { PostPolicyService } from './post-policy.service';
import { GroupModule } from '../../shared/group';

@Module({
  imports: [DatabaseModule, PostModule, UserModule, GroupModule, MediaModule, MentionModule],
  providers: [PostService, PostPolicyService],
  exports: [PostService, PostPolicyService],
  controllers: [PostController],
})
export class PostModule {}
