import { FeedModule } from '../feed';
import { PostModule } from '../post';
import { Module } from '@nestjs/common';
import { ArticleModule } from '../article';
import { CommentModule } from '../comment';
import { UserModule } from '../../shared/user';
import { GroupModule } from '../../shared/group';
import { ReportContentService } from './report-content.service';
import { ReportContentController } from './report-content.controller';

@Module({
  imports: [UserModule, GroupModule, PostModule, ArticleModule, CommentModule, FeedModule],
  controllers: [ReportContentController],
  providers: [ReportContentService],
})
export class ReportContentModule {}
