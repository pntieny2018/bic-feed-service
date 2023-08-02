import { LibModule } from './lib.module';
import { FeedModule } from '../modules/feed';
import { PostModule } from '../modules/post';
import { SeriesModule } from '../modules/series';
import { ListenerModule } from '../listeners';
import { MediaModule } from '../modules/media';
import { UploadModule } from '../modules/upload';
import { AppController } from './app.controller';
import { CommentModule } from '../modules/comment';
import { MentionModule } from '../modules/mention';
import { NotificationModule } from '../notification';
import { AuthorityModule } from '../modules/authority';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ReactionCountModule } from '../shared/reaction-count';
import { FeedPublisherModule } from '../modules/feed-publisher';
import { FeedGeneratorModule } from '../modules/feed-generator';
import { DatabaseModule } from '../database';
import { ArticleModule } from '../modules/article';
import { CategoryModule } from '../modules/category';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthModule } from '../modules/health/health.module';
import { InternalModule } from '../modules/internal';
import { SearchModule } from '../modules/search';
import { ReportContentModule } from '../modules/report-content/report-content.module';
import { PostModuleV2 } from '../modules/v2-post/post.module';
import { FilterUserModule } from '../modules/filter-user';
import { AdminModule } from '../modules/admin/admin.module';
import { GroupModuleV2 } from '../modules/v2-group/group.module';
import { UserModuleV2 } from '../modules/v2-user/user.module';
import { I18nGlobalModule } from '../modules/i18n/i18n-global.module';
import { I18nMiddleware } from 'nestjs-i18n';
import { RecentSearchModuleV2 } from '../modules/v2-recent-search/recent-search.module';
import { GiphyModuleV2 } from '../modules/v2-giphy/giphy.module';
import { ApiVersioningMiddleware, AuthMiddleware } from '../middlewares';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    DatabaseModule,
    HttpModule,
    FilterUserModule,
    LibModule,
    CommentModule,
    FeedModule,
    PostModule,
    UploadModule,
    MediaModule,
    MentionModule,
    // ReactionModule,
    ListenerModule,
    AuthorityModule,
    NotificationModule,
    ReactionCountModule,
    FeedGeneratorModule,
    FeedPublisherModule,
    ArticleModule,
    SeriesModule,
    CategoryModule,
    //TagModule,
    ScheduleModule.forRoot(),
    HealthModule,
    SeriesModule,
    InternalModule,
    SearchModule,
    ReportContentModule,
    PostModuleV2,
    GroupModuleV2,
    UserModuleV2,
    RecentSearchModuleV2,
    GiphyModuleV2,
    AdminModule,
    I18nGlobalModule,
  ],
  controllers: [AppController],
  providers: [],
  exports: [],
})
export class AppModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer.apply(I18nMiddleware, ApiVersioningMiddleware, AuthMiddleware).forRoutes('*');
  }
}
