import { MediaModule } from '../media';
import { forwardRef, Module } from '@nestjs/common';
import { MentionModule } from '../mention';
import { CommentModule } from '../comment';
import { AuthorityModule } from '../authority';
import { ReactionModule } from '../reaction';
import { ArticleService } from './article.service';
import { PostModule } from '../post';
import { ArticleController } from './article.controller';
import { CategoryModule } from '../category';
import { SeriesModule } from '../series';
import { CanUseCategoryConstraint } from './validators/can-use-category.validator';
import { CanUseSeriesConstraint } from './validators/can-use-series.validator';
import { FeedModule } from '../feed';
import { LinkPreviewModule } from '../link-preview/link-preview.module';
import { ArticleAppService } from './application/article.app-service';
import { SearchModule } from '../search';
import { TagModule } from '../tag';
import { UserModuleV2 } from '../v2-user/user.module';
import { GroupModuleV2 } from '../v2-group/group.module';

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
    forwardRef(() => ReactionModule),
    AuthorityModule,
    LinkPreviewModule,
    forwardRef(() => CommentModule),
    forwardRef(() => SeriesModule),
  ],
  controllers: [ArticleController],
  providers: [ArticleService, ArticleAppService, CanUseCategoryConstraint, CanUseSeriesConstraint],
  exports: [ArticleService],
})
export class ArticleModule {}
