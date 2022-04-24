import Redis from 'ioredis';
import { Queue, Worker } from 'bullmq';
import { IRedisConfig } from '../config/redis';
import { REACTION_KIND_LIMIT } from '../modules/reaction/reaction.constant';

export function getDynamicQueues(): Map<string, Queue> {
  if (!global.DynamicQueues) {
    global.DynamicQueues = new Map<string, Queue>();
  }
  return global.DynamicQueues;
}

export function findOrRegisterQueue(
  queueName: string,
  jobHandle: (...args: any[]) => any,
  options?: IRedisConfig
): Queue {
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
    // prefix: options.prefix,
    connection: redisConnection,
    sharedConnection: true,
  });

  queues.set(queueName, queue);

  const worker = new Worker(queueName, jobHandle, {
    concurrency: REACTION_KIND_LIMIT,
    connection: redisConnection,
    sharedConnection: true,
  });

  worker.on('failed', (job, result) => {
    process.stdout.write(
      `[ReactionQueue] ${job.id} Job failed with result: ${JSON.stringify(result)} \n`
    );
  });

  worker.on('completed', (job, result) => {
    process.stdout.write(
      `[ReactionQueue] ${job.id} Job completed with result: ${JSON.stringify(result)} \n`
    );
  });

  return queue;
}
