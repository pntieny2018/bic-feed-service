import { MediaModule } from '../media';
import { UserModule } from '../../shared/user';
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { GroupModule } from 'src/shared/group';
import { MentionModule } from '../mention';
import { PostPolicyService } from './post-policy.service';

@Module({
  imports: [DatabaseModule, UserModule, GroupModule, MediaModule, MentionModule, PostPolicyService],
  providers: [PostService],
  controllers: [PostController],
})
export class PostModule {}
