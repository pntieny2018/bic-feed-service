import { PostModule } from '../modules/post';
import { Module } from '@nestjs/common';
import { CommentNotificationService, ContentNotificationService } from './services';
import { CommentDissociationService } from './dissociations';
import { NotificationService } from './notification.service';
import { CommentModule } from '../modules/comment';
import {
  CommentActivityService,
  PostActivityService,
  ReactionActivityService,
  ReportActivityService,
  SeriesActivityService,
} from './activities';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { IAxiosConfig } from '../config/axios';

@Module({
  imports: [
    PostModule,
    CommentModule,
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
    CommentActivityService,
    CommentDissociationService,
    CommentNotificationService,
    ContentNotificationService,
    SeriesActivityService,
  ],

  exports: [
    SeriesActivityService,
    ReportActivityService,
    NotificationService,
    PostActivityService,
    ReactionActivityService,
    CommentActivityService,
    CommentDissociationService,
    CommentNotificationService,
    ContentNotificationService,
  ],
})
export class NotificationModule {}
