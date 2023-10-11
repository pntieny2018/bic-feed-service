import { KafkaModule } from '@libs/infra/kafka';
import { Module } from '@nestjs/common';

import {
  CommentNotificationApplicationService,
  ContentNotificationApplicationService,
} from './application/application-services';
import {
  COMMENT_NOTIFICATION_APPLICATION_SERVICE,
  CONTENT_NOTIFICATION_APPLICATION_SERVICE,
} from './application/application-services/interface';
import { KAFKA_ADAPTER } from './domain/infra-adapter-interface';
import { KafkaAdapter } from './driven-adapter/infra';

@Module({
  imports: [KafkaModule],
  controllers: [],
  providers: [
    {
      provide: COMMENT_NOTIFICATION_APPLICATION_SERVICE,
      useClass: CommentNotificationApplicationService,
    },
    {
      provide: CONTENT_NOTIFICATION_APPLICATION_SERVICE,
      useClass: ContentNotificationApplicationService,
    },
    {
      provide: KAFKA_ADAPTER,
      useClass: KafkaAdapter,
    },
  ],
  exports: [
    {
      provide: COMMENT_NOTIFICATION_APPLICATION_SERVICE,
      useClass: CommentNotificationApplicationService,
    },
    {
      provide: CONTENT_NOTIFICATION_APPLICATION_SERVICE,
      useClass: ContentNotificationApplicationService,
    },
  ],
})
export class NotificationModuleV2 {}
