import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { configs } from '../config/configuration';
import { FeedModule } from '../modules/feed/feed.module';
import { PostModule } from 'src/modules/post';
import { RecentSearchModule } from 'src/modules/recent-search';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configs],
    }),
    PostModule,
    RecentSearchModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
