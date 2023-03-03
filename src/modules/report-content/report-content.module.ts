import { Module } from '@nestjs/common';
import { GroupModule } from '../../shared/group';
import { FeedModule } from '../feed';
import { PostModule } from '../post';
import { CommentModule } from '../comment';
import { ReportContentService } from './report-content.service';
import { ReportContentController } from './report-content.controller';
import { ArticleModule } from '../article';
import { UserModuleV2 } from '../v2-user/user.module';

@Module({
  imports: [UserModuleV2, ArticleModule, GroupModule, PostModule, CommentModule, FeedModule],
  controllers: [ReportContentController],
  providers: [ReportContentService],
  exports: [ReportContentService],
})
export class ReportContentModule {}
