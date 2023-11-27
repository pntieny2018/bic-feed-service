import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';

import { IQueueService, IQueueServiceConfig } from './interfaces/queue.interface';
import { QueuePro } from './shared';

export class QueueService implements IQueueService {
  private _queue: QueuePro;

  public constructor(private readonly _config: IQueueServiceConfig) {
    const { queueName, queueConfig } = this._config;
    this._queue = new QueuePro(queueName, queueConfig);
  }

  public async add<T>(data: T, groupId: string = randomStringGenerator()): Promise<void> {
    await this._queue.add(this._config.queueName, data, {
      group: { id: groupId },
    });
  }

  public async close(): Promise<void> {
    return this._queue.close();
  }
}
