import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IQueueConfig } from '@app/queue/config/queue-config.interface';
import { QUEUES } from '@app/queue/queue.constant';
import { SentryModule } from '@app/sentry';
import { configs } from '@app/queue/config/configuration';

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
