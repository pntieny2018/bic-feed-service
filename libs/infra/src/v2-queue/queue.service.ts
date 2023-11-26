import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { DefaultJobOptions } from 'bullmq';

import { IQueueService } from './interfaces/queue.interface';
import { QueuePro, QueueProOptions } from './shared';

export class QueueService implements IQueueService {
  private _queue: QueuePro;

  public constructor(
    private readonly _config: {
      queueName: string;
      queueConfig: QueueProOptions;
    }
  ) {
    const { queueName, queueConfig } = this._config;
    this._queue = new QueuePro(queueName, queueConfig);
  }

  public getDefaultJobOptions(): DefaultJobOptions {
    return {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 3000,
      },
      removeOnComplete: true,
      removeOnFail: true,
    };
  }

  public async add<T>(data: T, groupId: string = randomStringGenerator()): Promise<void> {
    await this._queue.add(this._config.queueName, data, {
      group: { id: groupId },
      ...this.getDefaultJobOptions(),
    });
  }

  public async close(): Promise<void> {
    return this._queue.close();
  }
}
