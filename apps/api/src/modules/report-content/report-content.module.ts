import { Module } from '@nestjs/common';
import { FeedModule } from '../feed';
import { PostModule } from '../post';
import { CommentModule } from '../comment';
import { ReportContentService } from './report-content.service';
import { ReportContentController } from './report-content.controller';
import { ArticleModule } from '../article';
import { UserModuleV2 } from '../v2-user/user.module';
import { RedisModule } from '@app/redis';
import { GroupModuleV2 } from '../v2-group/group.module';

@Module({
  imports: [
    RedisModule,
    UserModuleV2,
    ArticleModule,
    GroupModuleV2,
    PostModule,
    CommentModule,
    FeedModule,
  ],
  controllers: [ReportContentController],
  providers: [ReportContentService],
  exports: [ReportContentService],
})
export class ReportContentModule {}
