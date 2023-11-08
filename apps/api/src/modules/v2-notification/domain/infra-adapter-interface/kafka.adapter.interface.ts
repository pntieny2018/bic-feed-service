import { IKafkaProducerMessage } from '@libs/infra/kafka';

export const KAFKA_ADAPTER = 'KAFKA_ADAPTER';

export interface IKafkaAdapter {
  emit(topic: string, payload: IKafkaProducerMessage): Promise<void>;
}
