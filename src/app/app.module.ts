import { LibModule } from './lib.module';
import { AppService } from './app.service';
import { FeedModule } from '../modules/feed';
import { PostModule } from 'src/modules/post';
import { UploadModule } from '../modules/upload';
import { AppController } from './app.controller';
import { CommentModule } from '../modules/comment';
import { AuthMiddleware, AuthModule } from '../modules/auth';
import { RecentSearchModule } from '../modules/recent-search';
import { Logger, MiddlewareConsumer, Module } from '@nestjs/common';
import { MediaModule } from '../modules/media/media.module';
import { UserModule } from '../shared/user';

@Module({
  controllers: [AppController],
  providers: [AppService, Logger],
  imports: [
    LibModule,
    AuthModule,
    CommentModule,
    FeedModule,
    RecentSearchModule,
    PostModule,
    UploadModule,
    MediaModule,
    UserModule,
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
