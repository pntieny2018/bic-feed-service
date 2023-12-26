import { PostModuleV2 as ApiPostModule } from '@api/modules/v2-post/post.module';
import { configs } from '@libs/common/config/configuration';
import { HEADER_REQ_ID } from '@libs/common/constants';
import { OpenTelemetryModule } from '@libs/common/modules/opentelemetry';
import { PostgresModule } from '@libs/database/postgres/postgres.module';
import { KafkaModule } from '@libs/infra/kafka';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { ScheduleModule } from '@nestjs/schedule';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
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
    OpenTelemetryModule.forRoot({
      serviceName: process.env.APP_NAME,
      resource: new Resource({
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.APP_ENV,
        [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.1',
      }),
      spanProcessor: new BatchSpanProcessor(
        new OTLPTraceExporter({
          url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}`,
        })
      ),
    }),
  ],
  providers: [],
  exports: [],
})
export class WorkerModule {}
