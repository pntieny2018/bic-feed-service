export const KAFKA_SERVICE_TOKEN = 'KAFKA_SERVICE_TOKEN';

export interface IKafkaService {
  emit<TInput>(topic: string, payload: TInput): void;
}
