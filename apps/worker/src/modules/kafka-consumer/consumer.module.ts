import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { consumerProvider } from './consumer.provider';

@Module({
  imports: [CqrsModule],
  controllers: [...consumerProvider],
})
export class ConsumerModule {}
