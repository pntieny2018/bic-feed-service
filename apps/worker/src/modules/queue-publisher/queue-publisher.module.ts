import { IRedisConfig } from '@libs/common/config/redis';
import {
  IQueueFlowService,
  IQueueService,
  QueueFlowService,
  QueueService,
  WrapperModule,
  getQueueConfig,
  getQueueFlowConfig,
} from '@libs/infra/v2-queue';
import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PUBLISHER_APPLICATION_SERVICE } from './application/interface';
import { PublisherApplicationService } from './application/publisher.application-service';
import { QueueAdapters, QueueFlowAdapters } from './domain/infra-interface';
import { PUBLISHER_DOMAIN_SERVICE_TOKEN } from './domain/interface';
import { PublisherDomainService } from './domain/publisher-domain.service';
import { ContentScheduledPublisher } from './driven-adapter/infra/queue';
import { QUEUE_ADAPTER_SERVICES, QUEUE_FLOW_ADAPTER_SERVICES } from './provider';

const publisherInstances = [ContentScheduledPublisher];

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

const createQueueFlowServiceProviders = (adapters: QueueFlowAdapters[]): Provider[] => {
  return adapters.map((adapter) => {
    return {
      provide: adapter.serviceToken,
      useFactory: (configService: ConfigService): IQueueFlowService => {
        const redisConfig = configService.get<IRedisConfig>('redis');
        const queueFlowConfig = getQueueFlowConfig(redisConfig);
        return new QueueFlowService({
          queueFlowConfig,
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
    ...createQueueFlowServiceProviders(QUEUE_FLOW_ADAPTER_SERVICES),
  ],
  exports: [
    {
      provide: PUBLISHER_APPLICATION_SERVICE,
      useClass: PublisherApplicationService,
    },
  ],
})
export class WorkerQueuePublisherModule {}
