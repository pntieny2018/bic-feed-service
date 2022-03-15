import { Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { DatabaseModule } from '../../database';
import { UserModule } from '../../shared/user';
import { MentionModule } from '../mention';

@Module({
  imports: [DatabaseModule, UserModule, MentionModule],
  controllers: [CommentController],
  providers: [CommentService],
})
export class CommentModule {}
