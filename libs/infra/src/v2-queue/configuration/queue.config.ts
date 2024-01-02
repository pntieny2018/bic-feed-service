import { IRedisConfig } from '@libs/common/config/redis';
import { DefaultJobOptions } from 'bullmq';

import { QueueProOptions } from '../shared';

export const getDefaultJobOptions = (): DefaultJobOptions => ({
  removeOnComplete: true,
  removeOnFail: true,
});

export const getQueueConfig = (redisConfig: IRedisConfig): QueueProOptions => {
  const sslConfig = redisConfig.ssl
    ? { tls: { host: redisConfig.host, port: redisConfig.port } }
    : {};
  return {
    isPro: true,
    streams: {
      events: {
        maxLen: 10,
      },
    },
    prefix: `bullmq:${redisConfig.env}`,
    connection: {
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
      ...sslConfig,
      db: redisConfig.db,
    },
    sharedConnection: true,
    defaultJobOptions: getDefaultJobOptions(),
  };
};
