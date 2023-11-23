import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PostModuleV2 } from '@api/modules/v2-post/post.module';
import { FollowConsumer } from './module/main/kafka-consumer/follow.consumer';
import { MediaConsumer } from './module/main/kafka-consumer/media.consumer';
import { GroupConsumer } from './module/main/kafka-consumer/group.consumer';
import { PublishOrRemovePostToNewsfeedConsumer } from './module/main/kafka-consumer/publish-remove-post-to-newsfeed.consumer';
import { LibModule } from '@api/app/lib.module';
import { ClsModule } from 'nestjs-cls';
import { HEADER_REQ_ID } from '@libs/common/constants';
import { v4 as uuid } from 'uuid';
import { DatabaseModule } from '@api/database';
import { HealthModule } from '@api/modules/health/health.module';

@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: false,
        saveReq: true,
        generateId: true,
        idGenerator: (req: Request) => {
          return req.headers[HEADER_REQ_ID] ?? (uuid() as any);
        },
      },
    }),
    DatabaseModule,
    HttpModule,
    LibModule,
    CqrsModule,
    PostModuleV2,
    HealthModule,
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
