import {
  ConsumerConfig,
  ConsumerRunConfig,
  ConsumerSubscribeTopic,
  KafkaConfig,
  ProducerConfig,
  ProducerRecord,
} from '@nestjs/microservices/external/kafka.interface';

export interface IKafkaConfig {
  env?: string;
  postfixId?: string;
  client?: KafkaConfig;
  consumer?: ConsumerConfig;
  run?: Omit<ConsumerRunConfig, 'eachBatch' | 'eachMessage'>;
  subscribe?: Omit<ConsumerSubscribeTopic, 'topic'>;
  producer?: ProducerConfig;
  send?: Omit<ProducerRecord, 'topic' | 'messages'>;
}
