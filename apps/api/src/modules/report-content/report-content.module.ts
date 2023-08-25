import { RedisModule } from '@libs/infra/redis';
import { Module } from '@nestjs/common';

import { ArticleModule } from '../article';
import { CommentModule } from '../comment';
import { FeedModule } from '../feed';
import { PostModule } from '../post';
import { GroupModuleV2 } from '../v2-group/group.module';
import { UserModuleV2 } from '../v2-user/user.module';

import { ReportContentController } from './report-content.controller';
import { ReportContentService } from './report-content.service';

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
