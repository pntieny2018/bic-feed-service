import { IRedisConfig } from '@libs/common/config/redis';
import {
  IQueueServiceConfig,
  IQueueService,
  QueueService,
  WrapperModule,
} from '@libs/infra/v2-queue';
import { getQueueConfig } from '@libs/infra/v2-queue/configuration';
import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PublisherFactoryService } from './application';
import { PUBLISHER_FACTORY_SERVICE } from './application/interface';
import { QUEUE_ADAPTER_SERVICES } from './data-type/constants';
import { ContentScheduledPublisher } from './driven-adapter/infra';
import { adapterServiceToQueueName } from './utils';

const PUBLISHERS = [ContentScheduledPublisher];

const createQueueServiceProviders = (services: string[]): Provider[] => {
  return services.map((service) => {
    return {
      provide: service,
      useFactory: (configService: ConfigService): IQueueService => {
        const redisConfig = configService.get<IRedisConfig>('redis');
        const queueConfig = getQueueConfig(redisConfig);
        const queueName = adapterServiceToQueueName(service);

        return new (class extends QueueService {
          public constructor(config: IQueueServiceConfig) {
            super(config);
          }
        })({
          queueName,
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
