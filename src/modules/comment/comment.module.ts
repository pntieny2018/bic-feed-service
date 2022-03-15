import { Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { DatabaseModule } from '../../database';
import { UserModule } from '../../shared/user';

@Module({
  imports: [DatabaseModule, UserModule],
  controllers: [CommentController],
  providers: [CommentService],
})
export class CommentModule {}
