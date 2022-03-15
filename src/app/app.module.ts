import { LibModule } from './lib.module';
import { AppService } from './app.service';
import { FeedModule } from '../modules/feed';
import { AppController } from './app.controller';
import { AuthMiddleware, AuthModule } from '../modules/auth';
import { RecentSearchModule } from '../modules/recent-search';
import { Logger, MiddlewareConsumer, Module } from '@nestjs/common';
import { PostModule } from 'src/modules/post';
import { EventEmitterModule } from '@nestjs/event-emitter';
@Module({
  imports: [
    LibModule,
    AuthModule,
    FeedModule,
    RecentSearchModule,
    PostModule,
    EventEmitterModule.forRoot({
      verboseMemoryLeak: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService, Logger],
})
export class AppModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AuthMiddleware).exclude('/api/health-check').forRoutes('*');
  }
}
