import { MediaModule } from './../media/media.module';
import { UserModule } from './../../shared/user/user.module';
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { GroupModule } from 'src/shared/group';
import { MentionModule } from '../mention';

@Module({
  imports: [DatabaseModule, UserModule, GroupModule, MediaModule, MentionModule],
  providers: [PostService],
  controllers: [PostController],
})
export class PostModule {}
