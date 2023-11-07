export interface IKafkaConsumeMessage<T> {
  topic: string;
  partition: number;
  key: string;
  headers: {
    [key: string]: any;
  };
  value: T;
}
