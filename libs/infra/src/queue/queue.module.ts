import { SentryModule } from '@app/sentry';
import { QUEUES } from '@libs/common/constants';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { IQueueConfig, configs } from './config';
import { QUEUE_SERVICE_TOKEN } from './interfaces';
import { QueueService } from './queue.service';

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
      defaultJobOptions: configs().defaultJobOptions,
    }),
    BullModule.registerQueue({
      name: QUEUES.QUIZ_PARTICIPANT_RESULT.QUEUE_NAME,
      defaultJobOptions: configs().defaultJobOptions,
    }),
    BullModule.registerQueue({
      name: QUEUES.CONTENT.QUEUE_NAME,
      defaultJobOptions: configs().defaultJobOptions,
    }),
  ],
  providers: [{ provide: QUEUE_SERVICE_TOKEN, useClass: QueueService }],
  exports: [QUEUE_SERVICE_TOKEN],
})
export class QueueModule {}
