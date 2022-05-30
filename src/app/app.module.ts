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
import { CategoryModule } from '../modules/category';

@Module({
  imports: [
    DatabaseModule,
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
    SeriesModule,
    CategoryModule,
  ],
  controllers: [AppController],
  providers: [],
  exports: [],
})
export class AppModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AuthMiddleware)
      .exclude('/api/health-check', 'api/v1/follows', 'api/v1/app')
      .forRoutes('*');
  }
}
