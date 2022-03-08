import { getAppConfig, IAppConfig } from './app';
import { getKafkaConfig, IKafkaConfig } from './kafka';
import { getEventConfig, IEventConfig } from './event';
import { getAxiosConfig, IAxiosConfig } from './axios';
import { getRedisConfig, IRedisConfig } from './redis';
import { getSentryConfig, ISentryConfig } from './sentry';
import { getCognitoConfig, ICognitoConfig } from './cognito';
import { getSwaggerConfig, ISwaggerConfig } from './swagger';
import { getDatabaseConfig, IDatabaseConfig } from './database';
import { getSocketIoConfig, ISocketIoConfig } from './socket-io';
import { getElasticsearchConfig, IElasticsearchConfig } from './elasticsearch';

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
  kafka: getKafkaConfig(),
});
