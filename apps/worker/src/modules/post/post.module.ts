import { KafkaModule } from '@libs/infra/kafka';
import { UserModule } from '@libs/service/user';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { WorkerQueuePublisherModule } from '../queue-publisher/queue-publisher.module';

import {
  FollowConsumer,
  GroupConsumer,
  MediaConsumer,
  PublishOrRemovePostToNewsfeedConsumer,
} from './driving-apdater/controller';
import {
  adapterProvider,
  distributedLockProvider,
  feedProvider,
  libRepositoryProvider,
  postProvider,
} from './provider';

@Module({
  imports: [CqrsModule, KafkaModule, UserModule, WorkerQueuePublisherModule],
  controllers: [
    FollowConsumer,
    MediaConsumer,
    GroupConsumer,
    PublishOrRemovePostToNewsfeedConsumer,
  ],
  providers: [
    ...distributedLockProvider,
    ...adapterProvider,
    ...feedProvider,
    ...libRepositoryProvider,
    ...postProvider,
  ],
})
export class PostModule {}
