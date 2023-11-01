export const KAFKA_ADAPTER = 'KAFKA_ADAPTER';

export interface IKafkaAdapter {
  emit<T>(topic: string, payload: T): Promise<void>;
  sendMessages<T>(topic: string, messages: T[]): Promise<void>;
}
