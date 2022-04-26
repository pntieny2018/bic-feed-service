import { Module } from '@nestjs/common';
import { PostModule } from '../modules/post';
import { LibModule } from '../app/lib.module';
import { ReactionModule } from '../modules/reaction';
import { ReactionWorkerService } from './services';
import { CommentModule } from '../modules/comment';

@Module({
  imports: [LibModule, CommentModule, PostModule, ReactionModule],
  providers: [ReactionWorkerService],
  exports: [ReactionWorkerService],
})
export class WorkerModule {}
