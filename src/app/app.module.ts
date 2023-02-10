import { LibModule } from './lib.module';
import { UserModule } from '../shared/user';
import { FeedModule } from '../modules/feed';
import { PostModule } from '../modules/post';
import { SeriesModule } from '../modules/series';
import { ListenerModule } from '../listeners';
import { GroupModule } from '../shared/group';
import { MediaModule } from '../modules/media';
import { UploadModule } from '../modules/upload';
import { AppController } from './app.controller';
import { CommentModule } from '../modules/comment';
import { MentionModule } from '../modules/mention';
import { NotificationModule } from '../notification';
import { ReactionModule } from '../modules/reaction';
import { AuthorityModule } from '../modules/authority';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AuthMiddleware, AuthModule } from '../modules/auth';
import { RecentSearchModule } from '../modules/recent-search';
import { ReactionCountModule } from '../shared/reaction-count';
import { FeedPublisherModule } from '../modules/feed-publisher';
import { FeedGeneratorModule } from '../modules/feed-generator';
import { DatabaseModule } from '../database';
import { GiphyModule } from '../modules/giphy';
import { ArticleModule } from '../modules/article';
import { CategoryModule } from '../modules/category';
import { HashtagModule } from '../modules/hashtag';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthModule } from '../modules/health/health.module';
import { InternalModule } from '../modules/internal';
import { SearchModule } from '../modules/search';
import { ReportContentModule } from '../modules/report-content/report-content.module';
import { TagModule } from '../modules/tag';
import { PostModuleV2 } from '../modules/v2-post/post.module';
import { FilterUserModule } from '../modules/filter-user';
import { AdminModule } from '../modules/admin/admin.module';
import { GroupModuleV2 } from '../modules/v2-group/group.module';
import { UserModuleV2 } from '../modules/v2-user/user.module';

@Module({
  imports: [
    DatabaseModule,
    FilterUserModule,
    LibModule,
    AuthModule,
    CommentModule,
    FeedModule,
    PostModule,
    UploadModule,
    MediaModule,
    UserModule,
    GroupModule,
    MentionModule,
    ReactionModule,
    ListenerModule,
    AuthorityModule,
    RecentSearchModule,
    NotificationModule,
    ReactionCountModule,
    FeedGeneratorModule,
    FeedPublisherModule,
    GiphyModule,
    ArticleModule,
    SeriesModule,
    CategoryModule,
    HashtagModule,
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
    AdminModule,
  ],
  controllers: [AppController],
  providers: [],
  exports: [],
})
export class AppModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AuthMiddleware).forRoutes('*');
  }
}
