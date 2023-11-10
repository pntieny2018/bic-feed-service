import { KafkaModule } from '@libs/infra/kafka';
import { Module } from '@nestjs/common';

import {
  CommentNotificationApplicationService,
  ContentNotificationApplicationService,
  ReactionNotificationApplicationService,
  ReportNotificationApplicationService,
} from './application/application-services';
import {
  COMMENT_NOTIFICATION_APPLICATION_SERVICE,
  CONTENT_NOTIFICATION_APPLICATION_SERVICE,
  REACTION_NOTIFICATION_APPLICATION_SERVICE,
  REPORT_NOTIFICATION_APPLICATION_SERVICE,
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
      provide: REACTION_NOTIFICATION_APPLICATION_SERVICE,
      useClass: ReactionNotificationApplicationService,
    },
    {
      provide: REPORT_NOTIFICATION_APPLICATION_SERVICE,
      useClass: ReportNotificationApplicationService,
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
    {
      provide: REACTION_NOTIFICATION_APPLICATION_SERVICE,
      useClass: ReactionNotificationApplicationService,
    },
    {
      provide: REPORT_NOTIFICATION_APPLICATION_SERVICE,
      useClass: ReportNotificationApplicationService,
    },
  ],
})
export class NotificationModuleV2 {}
