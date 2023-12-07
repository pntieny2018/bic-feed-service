import { LibModule } from '@api/app/lib.module';
import { PostModuleV2 } from '@api/modules/v2-post/post.module';
import { configs } from '@libs/common/config/configuration';
import { HEADER_REQ_ID } from '@libs/common/constants';
import { PostgresModule } from '@libs/database/postgres/postgres.module';
import { KafkaModule } from '@libs/infra/kafka';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { ClsModule } from 'nestjs-cls';
import { v4 as uuid } from 'uuid';

import { HealthModule } from './modules/health/health.module';
import { ConsumerModule } from './modules/kafka-consumer/consumer.module';
import { ProcessorModule } from './modules/queue-processor/processor.module';

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
    PostgresModule,
    LibModule,
    CqrsModule,
    PostModuleV2,
    HealthModule,
    ProcessorModule,
    ConsumerModule,
    KafkaModule,
  ],
  providers: [],
  exports: [],
})
export class WorkerModule {}
