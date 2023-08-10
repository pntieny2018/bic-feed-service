import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  IQueueConfig,
  configs,
  QueueService,
  QUEUES_NAME,
  defaultJobOptions,
} from '@app/infra/queue';
import { SentryModule } from '@app/sentry';

@Module({
  imports: [
    SentryModule,
    ConfigModule.forRoot({
      cache: true,
      load: [configs],
    }),
    BullModule.forRootAsync({
      useFactory: async (configService: ConfigService) => {
        const config = configService.get<IQueueConfig>('queue');
        const tls = config.ssl
          ? {
              tls: {
                host: config.host,
                port: config.port,
              },
            }
          : {};
        return {
          prefix: config.prefix,
          redis: {
            host: config.host,
            port: config.port,
            password: config.password,
            ...tls,
          },
        };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: QUEUES_NAME.QUIZ_PENDING,
      limiter: {
        max: 3,
        duration: 1000,
      },
      defaultJobOptions,
    }),
    BullModule.registerQueue({
      name: QUEUES_NAME.QUIZ_PARTICIPANT_RESULT,
      defaultJobOptions,
    }),
  ],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
