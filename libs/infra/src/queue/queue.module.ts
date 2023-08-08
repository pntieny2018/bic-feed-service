import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IQueueConfig, configs, QUEUES, QueueService } from '@app/infra/queue';
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
      name: QUEUES.QUIZ_PENDING.QUEUE_NAME,
      limiter: {
        max: 3,
        duration: 1000,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 3000,
        },
      },
    }),
  ],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
