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
@Module({
  imports: [
    PostModule,
    UserModule,
    GroupModule,
    MediaModule,
    FeedModule,
    MentionModule,
    CategoryModule,
    HashtagModule,
    SeriesModule,
    forwardRef(() => ReactionModule),
    AuthorityModule,
    forwardRef(() => CommentModule),
    forwardRef(() => LinkPreviewModule),
  ],
  controllers: [ArticleController],
  providers: [
    ArticleService,
    ArticleBindingService,
    CanUseCategoryConstraint,
    CanUseSeriesConstraint,
  ],
  exports: [ArticleService],
})
export class ArticleModule {}
