import { IRedisConfig } from '@libs/common/config/redis';
import { FlowOpts, QueueBaseOptions } from 'bullmq';

export const getDefaultQueueFlowOpts = (queueName: string): FlowOpts => ({
  queuesOptions: {
    [queueName]: {
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
      },
      streams: {
        events: {
          maxLen: 10,
        },
      },
    },
  },
});

export const getQueueFlowConfig = (redisConfig: IRedisConfig): QueueBaseOptions => {
  const sslConfig = redisConfig.ssl
    ? { tls: { host: redisConfig.host, port: redisConfig.port } }
    : {};
  return {
    prefix: `bullmq:${redisConfig.env}`,
    connection: {
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
      ...sslConfig,
      db: redisConfig.db,
    },
    sharedConnection: true,
  };
};
