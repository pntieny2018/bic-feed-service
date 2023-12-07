import { IRedisConfig } from '@libs/common/config/redis';
import { IQueueService, QueueService, WrapperModule, getQueueConfig } from '@libs/infra/v2-queue';
import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { APPLICATION_PUBLISHER_SERVICE } from './application/interface';
import { PublisherService } from './application/publisher.service';
import { QueueAdapters } from './domain/infra-interface';
import { PUBLISHER_DOMAIN_SERVICE_TOKEN } from './domain/interface';
import { PublisherDomainService } from './domain/publisher-domain.service';
import { QUEUE_ADAPTER_SERVICES, publisherProvider } from './provider';

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
      provide: APPLICATION_PUBLISHER_SERVICE,
      useClass: PublisherService,
    },
    {
      provide: PUBLISHER_DOMAIN_SERVICE_TOKEN,
      useClass: PublisherDomainService,
    },
    ...createQueueServiceProviders(QUEUE_ADAPTER_SERVICES),
    ...publisherProvider,
  ],
  exports: [
    {
      provide: APPLICATION_PUBLISHER_SERVICE,
      useClass: PublisherService,
    },
  ],
})
export class QueuePublisherModule {}
