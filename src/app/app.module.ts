import { LibModule } from './lib.module';
import { AppService } from './app.service';
import { FeedModule } from '../modules/feed';
import { AppController } from './app.controller';
import { AuthMiddleware, AuthModule } from '../modules/auth';
import { Logger, MiddlewareConsumer, Module } from '@nestjs/common';

@Module({
  imports: [LibModule, AuthModule, FeedModule],
  controllers: [AppController],
  providers: [AppService, Logger],
})
export class AppModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AuthMiddleware).exclude('/api/health-check').forRoutes('*');
  }
}
