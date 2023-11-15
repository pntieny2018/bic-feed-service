import { MediaModule as LibMediaModule } from '@libs/service/media/media.module';
import { Module } from '@nestjs/common';

import { AuthorityModule } from '../authority';
import { CategoryModule } from '../category';
import { CommentModule } from '../comment';
import { FeedModule } from '../feed';
import { LinkPreviewModule } from '../link-preview/link-preview.module';
import { MediaModule } from '../media';
import { MentionModule } from '../mention';
import { PostModule } from '../post';
import { SearchModule } from '../search';
import { SeriesModule } from '../series';
import { TagModule } from '../tag';
import { GroupModuleV2 } from '../v2-group/group.module';
import { UserModuleV2 } from '../v2-user/user.module';

import { ArticleAppService } from './application/article.app-service';
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';
import { CanUseCategoryConstraint } from './validators/can-use-category.validator';
import { CanUseSeriesConstraint } from './validators/can-use-series.validator';

@Module({
  imports: [
    PostModule,
    UserModuleV2,
    GroupModuleV2,
    MediaModule,
    FeedModule,
    MentionModule,
    CategoryModule,
    TagModule,
    SearchModule,
    AuthorityModule,
    LinkPreviewModule,
    CommentModule,
    SeriesModule,
    LibMediaModule,
  ],
  controllers: [ArticleController],
  providers: [ArticleService, ArticleAppService, CanUseCategoryConstraint, CanUseSeriesConstraint],
  exports: [ArticleService],
})
export class ArticleModule {}
