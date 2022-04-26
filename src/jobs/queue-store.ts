import Redis from 'ioredis';
import { Queue } from 'bullmq';
import { IRedisConfig } from '../config/redis';
import { NetworkHelper } from '../common/helpers';

export function getDynamicQueues(): Map<string, Queue> {
  if (!global.DynamicQueues) {
    global.DynamicQueues = new Map<string, Queue>();
  }
  return global.DynamicQueues;
}

export function findOrRegisterQueue(queueName: string, options?: IRedisConfig): Queue {
  const queues = getDynamicQueues();
  if (queues.has(queueName)) {
    return queues.get(queueName);
  }
  const sslConfig = options.ssl
    ? {
        tls: {
          host: options.host,
          port: options.port,
          password: options.password,
        },
      }
    : {};

  const redisConnection = new Redis({
    host: options.host,
    port: options.port,
    password: options.password,
    maxRetriesPerRequest: null,
    ...sslConfig,
  });

  const queue = new Queue(queueName, {
    connection: redisConnection,
    sharedConnection: true,
  });

  redisConnection
    .duplicate()
    .publish(`${NetworkHelper.getPrivateIPs()[0]}:new_reaction_queue`, queueName)
    .catch((ex) => process.stdout.write('error when publish queue' + JSON.stringify(ex)));

  queues.set(queueName, queue);
  return queue;
}
