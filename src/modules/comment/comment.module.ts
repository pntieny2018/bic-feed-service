import { Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { DatabaseModule } from '../../database';
import { MentionModule } from '../mention';

@Module({
  imports: [DatabaseModule, MentionModule],
  controllers: [CommentController],
  providers: [CommentService],
})
export class CommentModule {}
