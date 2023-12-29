export interface IKafkaConsumerMessage<T> {
  topic: string;
  partition: number;
  key: string;
  headers: {
    [key: string]: any;
  };
  value: T;
}

export interface IKafkaProducerMessage {
  key: string;
  value: { [key: string]: any };
}
