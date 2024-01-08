import * as process from 'process';

import { FeedModule } from '@api/modules/feed';
import { HEADER_REQ_ID } from '@libs/common/constants';
import { OpenTelemetryModule } from '@libs/common/modules/opentelemetry';
import { PostgresModule } from '@libs/database/postgres/postgres.module';
import { UserModule } from '@libs/service/user';
import { HttpModule } from '@nestjs/axios';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { Resource } from '@opentelemetry/resources';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { ClsMiddleware, ClsModule } from 'nestjs-cls';
import { I18nMiddleware } from 'nestjs-i18n';
import { v4 as uuid } from 'uuid';

import { AUTH_MIDDLEWARE_WHITELIST_PATTERNS } from '../common/constants/endpoint.constant';
import { ApiVersioningMiddleware, AuthMiddleware } from '../middlewares';
import { AuthorityModule } from '../modules/authority';
import { HealthModule } from '../modules/health/health.module';
import { I18nGlobalModule } from '../modules/i18n/i18n-global.module';
import { QueuePublisherModule } from '../modules/queue-publisher/queue-publisher.module';
import { SearchModule } from '../modules/search';
import { GiphyModuleV2 } from '../modules/v2-giphy/giphy.module';
import { NotificationModuleV2 } from '../modules/v2-notification/notification.module';
import { PostModuleV2 } from '../modules/v2-post/post.module';
import { RecentSearchModuleV2 } from '../modules/v2-recent-search/recent-search.module';
import { WebSocketModule } from '../modules/ws/ws.module';

import { AppController } from './app.controller';
import { LibModule } from './lib.module';

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
    HttpModule,
    LibModule,
    AuthorityModule,
    FeedModule,
    NotificationModuleV2,
    WebSocketModule,
    HealthModule,
    SearchModule,
    PostModuleV2,
    RecentSearchModuleV2,
    GiphyModuleV2,
    I18nGlobalModule,
    PostgresModule,
    UserModule,

    OpenTelemetryModule.forRoot({
      serviceName: process.env.APP_NAME,
      resource: new Resource({
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.APP_ENV,
        [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.1',
      }),
      //traceExporter: new ConsoleSpanExporter(),
      spanProcessor: new BatchSpanProcessor(
        new OTLPTraceExporter({
          url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}`,
        })
      ),
    }),
    QueuePublisherModule,
  ],
  controllers: [AppController],
  providers: [],
  exports: [],
})
export class AppModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(ClsMiddleware, I18nMiddleware, ApiVersioningMiddleware)
      .forRoutes('*')
      .apply(AuthMiddleware)
      .exclude(...AUTH_MIDDLEWARE_WHITELIST_PATTERNS)
      .forRoutes('*');
  }
}
