import { KafkaModule } from '@libs/infra/kafka';
import { Module } from '@nestjs/common';

import { KAFKA_ADAPTER } from './domain/infra-adapter-interface';
import { KafkaAdapter } from './driven-adapter/infra';

@Module({
  imports: [KafkaModule],
  controllers: [],
  providers: [
    {
      provide: KAFKA_ADAPTER,
      useClass: KafkaAdapter,
    },
  ],
  exports: [],
})
export class WebSocketModule {}
