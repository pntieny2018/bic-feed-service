import { IKafkaProducerMessage } from './kafka.interface';

export const KAFKA_SERVICE_TOKEN = 'KAFKA_SERVICE_TOKEN';

export interface IKafkaService {
  emit(topic: string, payload: IKafkaProducerMessage): void;
  sendMessages(topic: string, payload: IKafkaProducerMessage[]): void;
}
