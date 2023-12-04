import { LibModule } from '@api/app/lib.module';
import { DatabaseModule } from '@api/database';
import { HealthModule } from '@api/modules/health/health.module';
import { PostModuleV2 } from '@api/modules/v2-post/post.module';
import { configs } from '@libs/common/config/configuration';
import { HEADER_REQ_ID } from '@libs/common/constants';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { ClsModule } from 'nestjs-cls';
import { v4 as uuid } from 'uuid';

import {
  FollowConsumer,
  GroupConsumer,
  MediaConsumer,
  PublishOrRemovePostToNewsfeedConsumer,
} from './module/main/kafka-consumer';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configs],
    }),
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
