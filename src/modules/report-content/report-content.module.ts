import { Module } from '@nestjs/common';
import { GroupModule } from '../../shared/group';
import { ArticleModule } from '../article';
import { CommentModule } from '../comment';
import { PostModule } from '../post';
import { ReportContentController } from './report-content.controller';
import { ReportContentService } from './report-content.service';

@Module({
  imports: [GroupModule, PostModule, ArticleModule, CommentModule],
  controllers: [ReportContentController],
  providers: [ReportContentService],
})
export class ReportContentModule {}
