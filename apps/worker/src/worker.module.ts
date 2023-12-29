import { PostModuleV2 as ApiPostModule } from '@api/modules/v2-post/post.module';
import { configs } from '@libs/common/config/configuration';
import { HEADER_REQ_ID } from '@libs/common/constants';
import { PostgresModule } from '@libs/database/postgres/postgres.module';
import { KafkaModule } from '@libs/infra/kafka';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { ScheduleModule } from '@nestjs/schedule';
import { ClsModule } from 'nestjs-cls';
import { v4 as uuid } from 'uuid';

import { HealthModule } from './modules/health/health.module';
import { PostModule } from './modules/post/post.module';
import { WorkerQueuePublisherModule } from './modules/queue-publisher/queue-publisher.module';
import { WorkerLibModule } from './worker.lib.module';

@Module({
  imports: [
    ApiPostModule, // TODO: Use v2-post module from worker
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
    CqrsModule,
    HealthModule,
    KafkaModule,
    PostgresModule,
    PostModule,
    ScheduleModule.forRoot(),
    WorkerLibModule,
    WorkerQueuePublisherModule,
  ],
  providers: [],
  exports: [],
})
export class WorkerModule {}
