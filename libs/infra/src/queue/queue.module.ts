import { SentryModule } from '@app/sentry';
import {
  IQueueConfig,
  configs,
  QueueService,
  QUEUES_NAME,
  defaultJobOptions,
} from '@libs/infra/queue';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

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
