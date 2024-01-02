import { IRedisConfig } from '@libs/common/config/redis';
import { IQueueService, QueueService, WrapperModule, getQueueConfig } from '@libs/infra/v2-queue';
import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PUBLISHER_APPLICATION_SERVICE } from './application/interface';
import { PublisherApplicationService } from './application/publisher.application-service';
import { QueueAdapters } from './domain/infra-interface';
import { PUBLISHER_DOMAIN_SERVICE_TOKEN } from './domain/interface';
import { PublisherDomainService } from './domain/publisher-domain.service';
import {
  ProducerAttachDetachNewsfeedPublisher,
  QuizParticipantPublisher,
  QuizPendingPublisher,
} from './driven-adapter/infra';
import { QUEUE_ADAPTER_SERVICES } from './provider';

const publisherInstances = [
  QuizPendingPublisher,
  QuizParticipantPublisher,
  ProducerAttachDetachNewsfeedPublisher,
];

const createQueueServiceProviders = (adapters: QueueAdapters[]): Provider[] => {
  return adapters.map((adapter) => {
    return {
      provide: adapter.serviceToken,
      useFactory: (configService: ConfigService): IQueueService => {
        const redisConfig = configService.get<IRedisConfig>('redis');
        const queueConfig = getQueueConfig(redisConfig);
        return new QueueService({
          queueName: adapter.queueName,
          queueConfig,
        });
      },
      inject: [ConfigService],
    };
  });
};

@WrapperModule({
  providers: [
    {
      provide: PUBLISHER_APPLICATION_SERVICE,
      useClass: PublisherApplicationService,
    },
    {
      provide: PUBLISHER_DOMAIN_SERVICE_TOKEN,
      useClass: PublisherDomainService,
    },
    ...createQueueServiceProviders(QUEUE_ADAPTER_SERVICES),
    ...publisherInstances,
  ],
  exports: [
    {
      provide: PUBLISHER_APPLICATION_SERVICE,
      useClass: PublisherApplicationService,
    },
  ],
})
export class QueuePublisherModule {}
