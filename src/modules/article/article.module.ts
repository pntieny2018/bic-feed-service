import { MediaModule } from '../media';
import { UserModule } from '../../shared/user';
import { forwardRef, Module } from '@nestjs/common';
import { MentionModule } from '../mention';
import { GroupModule } from '../../shared/group';
import { CommentModule } from '../comment';
import { AuthorityModule } from '../authority';
import { ReactionModule } from '../reaction';
import { ArticleService } from './article.service';
import { PostModule } from '../post';
import { ArticleController } from './article.controller';
import { CategoryModule } from '../category';
import { HashtagModule } from '../hashtag';
import { SeriesModule } from '../series';
import { CanUseCategoryConstraint } from './validators/can-use-category.validator';
import { CanUseSeriesConstraint } from './validators/can-use-series.validator';
import { FeedModule } from '../feed';
import { LinkPreviewModule } from '../link-preview/link-preview.module';
import { ArticleBindingService } from './article-binding.service';
import { ArticleAppService } from './application/article.app-service';
import { SearchModule } from '../search';
import { TagModule } from '../tag';
import { ArticleCronService } from './article-cron.service';
import { UserModuleV2 } from '../v2-user/user.module';
@Module({
  imports: [
    PostModule,
    UserModuleV2,
    GroupModule,
    MediaModule,
    FeedModule,
    MentionModule,
    CategoryModule,
    HashtagModule,
    TagModule,
    SearchModule,
    forwardRef(() => ReactionModule),
    AuthorityModule,
    forwardRef(() => CommentModule),
    forwardRef(() => LinkPreviewModule),
    forwardRef(() => SeriesModule),
  ],
  controllers: [ArticleController],
  providers: [
    ArticleService,
    ArticleAppService,
    ArticleBindingService,
    CanUseCategoryConstraint,
    CanUseSeriesConstraint,
    ArticleCronService,
  ],
  exports: [ArticleService, ArticleBindingService],
})
export class ArticleModule {}
