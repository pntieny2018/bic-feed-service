import { KafkaModule } from '@libs/infra/kafka';
import { UserModule } from '@libs/service/user';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { WorkerQueuePublisherModule } from '../queue-publisher/queue-publisher.module';

import {
  adapterProvider,
  consumerHandlerProvider,
  feedProvider,
  libRepositoryProvider,
  postProvider,
} from './provider';

@Module({
  imports: [CqrsModule, KafkaModule, UserModule, WorkerQueuePublisherModule],
  controllers: [],
  providers: [
    ...adapterProvider,
    ...feedProvider,
    ...libRepositoryProvider,
    ...postProvider,
    ...consumerHandlerProvider,
  ],
})
export class PostModule {}
