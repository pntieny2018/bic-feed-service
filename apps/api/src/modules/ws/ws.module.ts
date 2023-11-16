import { KafkaModule } from '@libs/infra/kafka';
import { Module } from '@nestjs/common';

import {
  CommentEventApplicationService,
  PostEventApplicationService,
  QuizEventApplicationService,
  ReactionEventApplicationService,
} from './application/application-services';
import {
  COMMENT_EVENT_APPLICATION_SERVICE,
  POST_EVENT_APPLICATION_SERVICE,
  QUIZ_EVENT_APPLICATION_SERVICE,
  REACTION_EVENT_APPLICATION_SERVICE,
} from './application/application-services/interface';
import { KAFKA_ADAPTER } from './domain/infra-adapter-interface';
import { KafkaAdapter } from './driven-adapter/infra';

@Module({
  imports: [KafkaModule],
  controllers: [],
  providers: [
    {
      provide: POST_EVENT_APPLICATION_SERVICE,
      useClass: PostEventApplicationService,
    },
    {
      provide: QUIZ_EVENT_APPLICATION_SERVICE,
      useClass: QuizEventApplicationService,
    },
    {
      provide: REACTION_EVENT_APPLICATION_SERVICE,
      useClass: ReactionEventApplicationService,
    },
    {
      provide: COMMENT_EVENT_APPLICATION_SERVICE,
      useClass: CommentEventApplicationService,
    },
    {
      provide: KAFKA_ADAPTER,
      useClass: KafkaAdapter,
    },
  ],
  exports: [
    {
      provide: POST_EVENT_APPLICATION_SERVICE,
      useClass: PostEventApplicationService,
    },
    {
      provide: QUIZ_EVENT_APPLICATION_SERVICE,
      useClass: QuizEventApplicationService,
    },
    {
      provide: REACTION_EVENT_APPLICATION_SERVICE,
      useClass: ReactionEventApplicationService,
    },
    {
      provide: COMMENT_EVENT_APPLICATION_SERVICE,
      useClass: CommentEventApplicationService,
    },
  ],
})
export class WebSocketModule {}
