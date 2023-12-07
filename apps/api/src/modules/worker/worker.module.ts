import { PostgresModule } from '@libs/database/postgres/postgres.module';
import { EventModule } from '@libs/infra/event';
import { KafkaModule } from '@libs/infra/kafka';
import { QueueModule } from '@libs/infra/queue';
import { HttpModule } from '@nestjs/axios';
import { forwardRef, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { LibModule } from '../../app/lib.module';
import { AuthorityModule } from '../authority';
import { HealthModule } from '../health/health.module';
import { SearchModule } from '../search';
import { PostModuleV2 } from '../v2-post/post.module';

import { FollowConsumer } from './kafka-consumer/follow.consumer';
import { GroupConsumer } from './kafka-consumer/group.consumer';
import { MediaConsumer } from './kafka-consumer/media.consumer';
import { PublishOrRemovePostToNewsfeedConsumer } from './kafka-consumer/publish-remove-post-to-newsfeed.consumer';

@Module({
  imports: [
    HealthModule,
    LibModule,
    HttpModule,
    CqrsModule,
    PostgresModule,
    AuthorityModule,
    KafkaModule,
    forwardRef(() => SearchModule),
    QueueModule,
    EventModule,
    PostModuleV2,
  ],
  controllers: [
    FollowConsumer,
    PublishOrRemovePostToNewsfeedConsumer,
    MediaConsumer,
    GroupConsumer,
  ],
  providers: [],
  exports: [],
})
export class WorkerModule {}
