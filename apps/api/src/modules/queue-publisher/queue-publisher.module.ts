import { IRedisConfig } from '@libs/common/config/redis';
import { IQueueService, QueueService, WrapperModule, getQueueConfig } from '@libs/infra/v2-queue';
import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PublisherFactoryService } from './application';
import { PUBLISHER_FACTORY_SERVICE } from './application/interface';
import { QUEUE_ADAPTER_SERVICES, QueueConstants } from './data-type';
import { ContentScheduledPublisher } from './driven-adapter/infra';

const PUBLISHERS = [ContentScheduledPublisher];

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
      provide: PUBLISHER_FACTORY_SERVICE,
      useClass: PublisherFactoryService,
    },
    ...createQueueServiceProviders(QUEUE_ADAPTER_SERVICES),
    ...PUBLISHERS,
  ],
  exports: [
    {
      provide: PUBLISHER_FACTORY_SERVICE,
      useClass: PublisherFactoryService,
    },
  ],
})
export class QueuePublihserModule {}
