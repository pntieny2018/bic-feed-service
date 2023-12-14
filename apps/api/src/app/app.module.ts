import { HEADER_REQ_ID } from '@libs/common/constants';
import { PostgresModule } from '@libs/database/postgres/postgres.module';
import { UserModule } from '@libs/service/user';
import { HttpModule } from '@nestjs/axios';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ClsMiddleware, ClsModule } from 'nestjs-cls';
import { I18nMiddleware } from 'nestjs-i18n';
import { v4 as uuid } from 'uuid';

import { AUTH_MIDDLEWARE_WHITELIST_PATTERNS } from '../common/constants/endpoint.constant';
import { DatabaseModule } from '../database';
import { ListenerModule } from '../listeners';
import { ApiVersioningMiddleware, AuthMiddleware } from '../middlewares';
import { AdminModule } from '../modules/admin/admin.module';
import { ArticleModule } from '../modules/article';
import { AuthorityModule } from '../modules/authority';
import { CategoryModule } from '../modules/category';
import { CommentModule } from '../modules/comment';
import { FeedModule } from '../modules/feed';
import { FeedGeneratorModule } from '../modules/feed-generator';
import { FeedPublisherModule } from '../modules/feed-publisher';
import { HealthModule } from '../modules/health/health.module';
import { I18nGlobalModule } from '../modules/i18n/i18n-global.module';
import { InternalModule } from '../modules/internal';
import { MediaModule } from '../modules/media';
import { MentionModule } from '../modules/mention';
import { PostModule } from '../modules/post';
import { QueuePublisherModule } from '../modules/queue-publisher/queue-publisher.module';
import { ReportContentModule } from '../modules/report-content/report-content.module';
import { SearchModule } from '../modules/search';
import { SeriesModule } from '../modules/series';
import { GiphyModuleV2 } from '../modules/v2-giphy/giphy.module';
import { GroupModuleV2 } from '../modules/v2-group/group.module';
import { NotificationModuleV2 } from '../modules/v2-notification/notification.module';
import { PostModuleV2 } from '../modules/v2-post/post.module';
import { RecentSearchModuleV2 } from '../modules/v2-recent-search/recent-search.module';
import { UserModuleV2 } from '../modules/v2-user/user.module';
import { WebSocketModule } from '../modules/ws/ws.module';
import { NotificationModule } from '../notification';
import { ReactionCountModule } from '../shared/reaction-count';

import { AppController } from './app.controller';
import { LibModule } from './lib.module';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OpenTelemetryModule } from '@libs/common/modules/opentelemetry';
import * as process from 'process';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { Resource } from '@opentelemetry/resources';

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
    CommentModule,
    FeedModule,
    PostModule,
    MediaModule,
    MentionModule,
    ListenerModule,
    AuthorityModule,
    NotificationModule,
    NotificationModuleV2,
    WebSocketModule,
    ReactionCountModule,
    FeedGeneratorModule,
    FeedPublisherModule,
    ArticleModule,
    SeriesModule,
    CategoryModule,
    ScheduleModule.forRoot(),
    HealthModule,
    SeriesModule,
    InternalModule,
    SearchModule,
    ReportContentModule,
    PostModuleV2,
    GroupModuleV2,
    UserModuleV2,
    RecentSearchModuleV2,
    GiphyModuleV2,
    AdminModule,
    I18nGlobalModule,
    PostgresModule,
    UserModule,

    OpenTelemetryModule.forRoot({
      serviceName: process.env.APP_NAME + '11',
      resource: new Resource({
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.APP_ENV,
        [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
      }),
      spanProcessor: new BatchSpanProcessor(
        new OTLPTraceExporter({
          url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`,
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
