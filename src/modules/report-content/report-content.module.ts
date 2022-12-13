import { PostModule } from '../post';
import { Module } from '@nestjs/common';
import { ArticleModule } from '../article';
import { CommentModule } from '../comment';
import { UserModule } from '../../shared/user';
import { GroupModule } from '../../shared/group';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ReportContentService } from './report-content.service';
import { ReportContentController } from './report-content.controller';

@Module({
  imports: [EventEmitter2, UserModule, GroupModule, PostModule, ArticleModule, CommentModule],
  controllers: [ReportContentController],
  providers: [ReportContentService],
})
export class ReportContentModule {}
