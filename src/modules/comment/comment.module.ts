import { Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { DatabaseModule } from '../../database';
import { MentionModule } from '../mention';
import { UserModule } from '../../shared/user';
import { PostModule } from '../post';
import { AuthorityModule } from '../authority';

@Module({
  imports: [DatabaseModule, AuthorityModule, PostModule, UserModule, MentionModule],
  controllers: [CommentController],
  providers: [CommentService],
})
export class CommentModule {}
