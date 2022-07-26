import { logLevel } from '@nestjs/microservices/external/kafka.interface';
import { IKafkaConfig } from '.';

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
    logLevel: logLevel.INFO,
  },
  consumer: {
    groupId: process.env.KAFKA_CONSUMER_GROUP_ID,
    sessionTimeout: 60000,
    maxWaitTimeInMs: 200, // 0.2 second
    minBytes: 1, // 1 bytes
    maxBytes: 100000, //100KB
  },
});
