import { IKafkaConfig, configs as kafkaConfig } from '@libs/infra/kafka';

import { getAppConfig, IAppConfig } from './app';
import { getAxiosConfig, IAxiosConfig } from './axios';
import { getCognitoConfig, ICognitoConfig } from './cognito';
import { getDatabaseConfig, IDatabaseConfig } from './database';
import { getElasticsearchConfig, IElasticsearchConfig } from './elasticsearch';
import { getEventConfig, IEventConfig } from './event';
import { getRedisConfig, IRedisConfig } from './redis';
import { getS3Config, IS3Config } from './s3';
import { getSentryConfig, ISentryConfig } from './sentry';
import { getSocketIoConfig, ISocketIoConfig } from './socket-io';
import { getSwaggerConfig, ISwaggerConfig } from './swagger';

interface IConfiguration {
  app: IAppConfig;
  redis: IRedisConfig;
  swagger: ISwaggerConfig;
  database: IDatabaseConfig;
  cognito: ICognitoConfig;
  axios: IAxiosConfig;
  event: IEventConfig;
  elasticsearch: IElasticsearchConfig;
  socket: ISocketIoConfig;
  sentry: ISentryConfig;
  kafka: IKafkaConfig;
  s3: IS3Config;
}

export const configs = (): IConfiguration => ({
  app: getAppConfig(),
  redis: getRedisConfig(),
  swagger: getSwaggerConfig(),
  database: getDatabaseConfig(),
  cognito: getCognitoConfig(),
  axios: getAxiosConfig(),
  event: getEventConfig(),
  elasticsearch: getElasticsearchConfig(),
  socket: getSocketIoConfig(),
  sentry: getSentryConfig(),
  ...kafkaConfig(),
  s3: getS3Config(),
});
