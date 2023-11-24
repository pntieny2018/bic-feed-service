import { getElasticsearchConfig, IElasticsearchConfig } from '@libs/common/config/elasticsearch';
import { getRedisConfig, IRedisConfig } from '@libs/common/config/redis';
import { getDatabaseConfig, IDatabaseConfig } from '@libs/database/postgres/config';
import { IAxiosConfig } from '@libs/infra/http';
import { getAxiosConfig } from '@libs/infra/http/config/axios.config';
import { getKafkaConfig, IKafkaConfig } from '@libs/infra/kafka/config';

import { getAppConfig, IAppConfig } from './app';
import { getEventConfig, IEventConfig } from './event';
import { getSentryConfig, ISentryConfig } from './sentry';
import { getSocketIoConfig, ISocketIoConfig } from './socket-io';
import { getSwaggerConfig, ISwaggerConfig } from './swagger';

interface IConfiguration {
  app: IAppConfig;
  redis: IRedisConfig;
  swagger: ISwaggerConfig;
  database: IDatabaseConfig;
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
  axios: getAxiosConfig(),
  event: getEventConfig(),
  elasticsearch: getElasticsearchConfig(),
  socket: getSocketIoConfig(),
  sentry: getSentryConfig(),
  kafka: getKafkaConfig(),
});
