import { LibModule } from './lib.module';
import { UserModule } from '../shared/user';
import { FeedModule } from '../modules/feed';
import { ListenerModule } from '../listeners';
import { GroupModule } from '../shared/group';
import { PostModule } from '../modules/post';
import { MediaModule } from '../modules/media';
import { UploadModule } from '../modules/upload';
import { CommentModule } from '../modules/comment';
import { MentionModule } from '../modules/mention';
import { AuthorityModule } from '../modules/authority';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AuthMiddleware, AuthModule } from '../modules/auth';
import { RecentSearchModule } from '../modules/recent-search';
import { NotificationModule } from '../modules/notification';
import { ReactionModule } from '../modules/reaction';

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
    RecentSearchModule,
    ListenerModule,
    AuthorityModule,
    NotificationModule,
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
