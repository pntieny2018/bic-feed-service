import { IRedisConfig } from '@libs/common/config/redis';
import { IQueueService, QueueService, WrapperModule, getQueueConfig } from '@libs/infra/v2-queue';
import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { APPLICATION_PUBLISHER_SERVICE } from './application/interface';
import { PublisherService } from './application/publisher.service';
import { QUEUE_ADAPTER_SERVICES, QueueConstants } from './data-type';
import { PUBLISHER_DOMAIN_SERVICE_TOKEN } from './domain/interface';
import { PublisherDomainService } from './domain/publisher-domain.service';
import { publisherProvider } from './driven-adapter/infra';

const createQueueServiceProviders = (services: QueueConstants[]): Provider[] => {
  return services.map((service) => {
    return {
      provide: service.SERVICE_TOKEN,
      useFactory: (configService: ConfigService): IQueueService => {
        const redisConfig = configService.get<IRedisConfig>('redis');
        const queueConfig = getQueueConfig(redisConfig);
        return new QueueService({
          queueName: service.QUEUE_NAME,
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
export class QueuePublihserModule {}
