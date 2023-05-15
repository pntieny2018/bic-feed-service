import { Module, Provider } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { IAxiosConfig } from '../../config/axios';
import { NotificationConsumer } from './driving-apdater/controller/notification.consumer';
import { SendPostPublishedNotificationHandler } from './application/command/send-post-published-notification/send-post-published-notification.handler';

@Module({
  imports: [
    HttpModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const axiosConfig = configService.get<IAxiosConfig>('axios');
        return {
          baseURL: axiosConfig.baseUrl,
          maxRedirects: axiosConfig.maxRedirects,
          timeout: axiosConfig.timeout,
        };
      },
    }),
  ],
  controllers: [NotificationConsumer],
  providers: [SendPostPublishedNotificationHandler],
  exports: [],
})
export class UserModuleV2 {}
