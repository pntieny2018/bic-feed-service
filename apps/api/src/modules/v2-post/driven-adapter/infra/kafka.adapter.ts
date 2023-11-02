import { IKafkaService, KAFKA_SERVICE_TOKEN } from '@libs/infra/kafka';
import { Inject } from '@nestjs/common';

import { IKafkaAdapter } from '../../domain/infra-adapter-interface';

export class KafkaAdapter implements IKafkaAdapter {
  public constructor(
    @Inject(KAFKA_SERVICE_TOKEN)
    private readonly _kafkaService: IKafkaService
  ) {}

  public async emit<T>(topic: string, payload: T): Promise<void> {
    return this._kafkaService.emit(topic, payload);
  }
}
