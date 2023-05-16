import { Module } from '@nestjs/common';
import { NotificationConsumer } from './driving-apdater/controller/notification.consumer';
import { SendPostPublishedNotificationHandler } from './application/command/send-post-published-notification/send-post-published-notification.handler';

@Module({
  imports: [],
  controllers: [NotificationConsumer],
  providers: [SendPostPublishedNotificationHandler],
  exports: [],
})
export class UserModuleV2 {}
