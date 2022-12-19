import { Module } from '@nestjs/common';
import { UserModule } from '../../shared/user';
import { GroupModule } from '../../shared/group';
import { FeedModule } from '../feed';
import { PostModule } from '../post';
import { CommentModule } from '../comment';
import { ReportContentService } from './report-content.service';
import { ReportContentController } from './report-content.controller';

@Module({
  imports: [UserModule, GroupModule, PostModule, CommentModule, FeedModule],
  controllers: [ReportContentController],
  providers: [ReportContentService],
  exports: [ReportContentService],
})
export class ReportContentModule {}
