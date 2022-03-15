import { LibModule } from './lib.module';
import { AppService } from './app.service';
import { FeedModule } from '../modules/feed';
import { UserModule } from '../shared/user';
import { GroupModule } from '../shared/group';
import { PostModule } from 'src/modules/post';
import { UploadModule } from '../modules/upload';
import { AppController } from './app.controller';
import { CommentModule } from '../modules/comment';
import { MentionModule } from '../modules/mention';
import { MediaModule } from '../modules/media/media.module';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AuthMiddleware, AuthModule } from '../modules/auth';
import { RecentSearchModule } from '../modules/recent-search';
import { EventEmitterModule } from '@nestjs/event-emitter';
@Module({
  controllers: [AppController],
  providers: [AppService],
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
    RecentSearchModule,
    PostModule,
    EventEmitterModule.forRoot({
      verboseMemoryLeak: true,
    }),
  ],
})
export class AppModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AuthMiddleware).exclude('/api/health-check').forRoutes('*');
  }
}
