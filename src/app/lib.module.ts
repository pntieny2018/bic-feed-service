import * as winston from 'winston';
import * as Sentry from '@sentry/node';
import { Module } from '@nestjs/common';
import { RedisModule } from '@app/redis';
import { HttpModule } from '@nestjs/axios';
import { SentryModule } from '@app/sentry';
import { IAxiosConfig } from '../config/axios';
import { IRedisConfig } from '../config/redis';
import { ISentryConfig } from '../config/sentry';
import { configs } from '../config/configuration';
import { RewriteFrames } from '@sentry/integrations';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configs],
    }),
    HttpModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const axiosConfig = configService.get<IAxiosConfig>('axios');
        return {
          baseURL: axiosConfig.baseUrl,
          maxRedirects: axiosConfig.maxRedirects,
          timeout: axiosConfig.timeout,
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
            db: redisConfig.db,
            host: redisConfig.host,
            port: redisConfig.port,
            password: redisConfig.password,
            ...sslConfig,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [HttpModule, RedisModule],
})
export class LibModule {}
