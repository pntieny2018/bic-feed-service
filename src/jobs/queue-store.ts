import Bull, { Queue, QueueOptions } from 'bull';

export function getDynamicQueues(): Map<string, Queue> {
  if (!global.DynamicQueues) {
    global.DynamicQueues = new Map<string, Queue>();
  }
  return global.DynamicQueues;
}

export function findOrRegisterQueue(
  queueName: string,
  jobHandle: (...args: any[]) => any,
  options?: QueueOptions
): Queue {
  const queues = getDynamicQueues();
  if (queues.has(queueName)) {
    return queues.get(queueName);
  }
  const queue = new Bull(queueName, options);

  queue.process(jobHandle);

  queues.set(queueName, queue);

  return queue;
}
