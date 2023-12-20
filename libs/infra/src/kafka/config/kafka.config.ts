import { logLevel } from '@nestjs/microservices/external/kafka.interface';

import { IKafkaConfig } from './kafka.config.interface';

export const getKafkaConfig = (): IKafkaConfig => ({
  env: process.env.KAFKA_ENV,
  postfixId: process.env.KAFKA_POSTFIXID,
  client: {
    clientId: process.env.KAFKA_CLIENT_ID,
    ssl: {
      ca: process.env.KAFKA_SSL_CA,
      key: process.env.KAFKA_SSL_KEY,
      cert: process.env.KAFKA_SSL_CERT,
    },
    brokers: [process.env.KAFKA_BOOTSTRAP_SERVERS],
    sasl: {
      mechanism: process.env.KAFKA_SASL_MECHANISMS as any,
      username: process.env.KAFKA_SASL_USERNAME,
      password: process.env.KAFKA_SASL_PASSWORD,
    },
    connectionTimeout: 30000,
    logLevel: logLevel.INFO,
  },
  consumer: {
    groupId: process.env.KAFKA_CONSUMER_GROUP_ID,
    maxBytes: 100000,
  },
  producerOnlyMode: process.env.KAFKA_PRODUCER_ONLY_MODE === 'true' || false,
});
