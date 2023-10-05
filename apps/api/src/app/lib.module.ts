import { DomainEventModule } from '@beincom/nest-domain-event';
import { HttpModule as LibHttpModule } from '@libs/infra/http';
import { LogModule } from '@libs/infra/log';
import { RedisModule } from '@libs/infra/redis';
import { SentryModule } from '@libs/infra/sentry';
import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ClientsModule, KafkaOptions, Transport } from '@nestjs/microservices';
import { RewriteFrames } from '@sentry/integrations';
import * as Sentry from '@sentry/node';

import { KAFKA_PRODUCER } from '../common/constants';
import { IAxiosConfig } from '../config/axios';
import { configs } from '../config/configuration';
import { IElasticsearchConfig } from '../config/elasticsearch';
import { IKafkaConfig } from '../config/kafka';
import { IRedisConfig } from '../config/redis';
import { ISentryConfig } from '../config/sentry';

import { InternalEventEmitterModule } from './custom/event-emitter';
import { ExternalService } from './external.service';

export const register = async (config: ConfigService): Promise<KafkaOptions> => {
  const kafkaConfig = config.get<IKafkaConfig>('kafka');
  return {
    transport: Transport.KAFKA,
    options: kafkaConfig,
  };
};
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configs],
    }),
    ClientsModule.registerAsync([
      {
        name: KAFKA_PRODUCER,
        useFactory: register,
        inject: [ConfigService],
      },
    ]),
    ElasticsearchModule.registerAsync({
      useFactory: async (configService: ConfigService) => {
        const elasticsearchConfig = configService.get<IElasticsearchConfig>('elasticsearch');
        return {
          node: elasticsearchConfig.node,
          tls: { rejectUnauthorized: elasticsearchConfig.tls, ca: elasticsearchConfig.ca },
          auth: {
            username: elasticsearchConfig.username,
            password: elasticsearchConfig.password,
          },
        };
      },
      inject: [ConfigService],
    }),
    HttpModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const axiosConfig = configService.get<IAxiosConfig>('axios');
        return {
          baseURL: axiosConfig.group.baseUrl,
          maxRedirects: axiosConfig.group.maxRedirects,
          timeout: axiosConfig.group.timeout,
        };
      },
    }),
    SentryModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const sentryConfig = configService.get<ISentryConfig>('sentry');
        return {
          dsn: sentryConfig.dsn,
          debug: sentryConfig.debug,
          enabled: sentryConfig.enable,
          release: sentryConfig.release,
          logLevels: sentryConfig.logLevel,
          environment: sentryConfig.environment,
          sampleRate: sentryConfig.tracesSampleRate,
          defaultIntegrations: false,
          integrations: [
            new Sentry.Integrations.Console(),
            new Sentry.Integrations.LinkedErrors(),
            new Sentry.Integrations.InboundFilters(),
            new Sentry.Integrations.FunctionToString(),
            new RewriteFrames({
              root: process.cwd(),
            }),
            new Sentry.Integrations.Http({ tracing: true }),
          ],
          beforeBreadcrumb: (breadcrumb, hint): Sentry.Breadcrumb => {
            if (breadcrumb.category === 'http') {
              breadcrumb.data = {
                ...breadcrumb.data,
                headers: hint['response']['req']['_header'],
              };
            }
            return breadcrumb;
          },
          close: {
            enabled: sentryConfig.closeWhenTimeout,
            timeout: sentryConfig.timeout,
          },
        };
      },
    }),
    RedisModule.registerAsync({
      useFactory: async (configService: ConfigService) => {
        const redisConfig = configService.get<IRedisConfig>('redis');
        const sslConfig = redisConfig.ssl
          ? {
              tls: {
                host: redisConfig.host,
                port: redisConfig.port,
                password: redisConfig.password,
              },
            }
          : {};

        return {
          redisOptions: {
            keyPrefix: redisConfig.prefix,
            host: redisConfig.host,
            port: redisConfig.port,
            password: redisConfig.password,
            ...sslConfig,
          },
        };
      },
      inject: [ConfigService],
    }),
    InternalEventEmitterModule,
    DomainEventModule,
    LibHttpModule.forRoot(),
    LogModule,
  ],
  providers: [ExternalService],
  exports: [ElasticsearchModule, ClientsModule, ExternalService],
})
export class LibModule {}
