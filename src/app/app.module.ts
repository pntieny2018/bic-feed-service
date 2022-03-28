import { LibModule } from './lib.module';
import { UserModule } from '../shared/user';
import { FeedModule } from '../modules/feed';
import { PostModule } from '../modules/post';
import { ListenerModule } from '../listeners';
import { GroupModule } from '../shared/group';
import { MediaModule } from '../modules/media';
import { UploadModule } from '../modules/upload';
import { CommentModule } from '../modules/comment';
import { MentionModule } from '../modules/mention';
import { NotificationModule } from '../notification';
import { ReactionModule } from '../modules/reaction';
import { AuthorityModule } from '../modules/authority';
import { FeedGeneratorModule } from '../feed-generator';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AuthMiddleware, AuthModule } from '../modules/auth';
import { RecentSearchModule } from '../modules/recent-search';

@Module({
  imports: [
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
    FeedGeneratorModule,
  ],
})
export class AppModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AuthMiddleware)
      .exclude('/api/document/**', '/api/health-check', '/api/')
      .forRoutes('*');
  }
}
