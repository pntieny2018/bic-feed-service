export interface IKafkaService {
  emit<TInput>(topic: string, payload: TInput): void;
}
