import { IAxiosConfig } from '@libs/infra/http';
import { KafkaModule } from '@libs/infra/kafka';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { CommentModule } from '../modules/comment';
import { PostModule } from '../modules/post';

import {
  PostActivityService,
  ReactionActivityService,
  ReportActivityService,
  SeriesActivityService,
} from './activities';
import { NotificationService } from './notification.service';
import { ContentNotificationService } from './services';

@Module({
  imports: [
    PostModule,
    CommentModule,
    KafkaModule,
    HttpModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const axiosConfig = configService.get<IAxiosConfig>('axios');
        return {
          baseURL: axiosConfig.notification.baseUrl,
          maxRedirects: axiosConfig.notification.maxRedirects,
          timeout: axiosConfig.notification.timeout,
        };
      },
    }),
  ],
  providers: [
    ReportActivityService,
    NotificationService,
    PostActivityService,
    ReactionActivityService,
    ContentNotificationService,
    SeriesActivityService,
  ],

  exports: [
    SeriesActivityService,
    ReportActivityService,
    NotificationService,
    PostActivityService,
    ReactionActivityService,
    ContentNotificationService,
  ],
})
export class NotificationModule {}
