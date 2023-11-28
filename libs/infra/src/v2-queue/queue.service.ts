import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { Job } from 'bullmq';

import { IQueueService, IQueueServiceConfig } from './interfaces/queue.interface';
import { JobsProOptions, QueuePro } from './shared';

export class QueueService implements IQueueService {
  private _queue: QueuePro;

  public constructor(private readonly _config: IQueueServiceConfig) {
    const { queueName, queueConfig } = this._config;
    this._queue = new QueuePro(queueName, queueConfig);
  }

  public async add<T>(data: T, opts?: JobsProOptions): Promise<void> {
    const defaultOptionWithGroup = { group: { id: randomStringGenerator() } };
    const options = Object.assign(defaultOptionWithGroup, opts || {});
    await this._queue.add(this._config.queueName, data, options);
  }

  public async addBulk<T>(jobs: { data: T; opts?: JobsProOptions }[]): Promise<void> {
    const defaultOptionWithGroup = { group: { id: randomStringGenerator() } };
    await this._queue.addBulk(
      jobs.map((job) => ({
        name: this._config.queueName,
        data: job.data,
        opts: Object.assign(defaultOptionWithGroup, job.opts || {}),
      }))
    );
  }

  public async get<T>(jobId: string): Promise<Job<T>> {
    return this._queue.getJob(jobId);
  }

  public async remove(jobId: string): Promise<boolean> {
    return Boolean(await this._queue.remove(jobId));
  }

  public async close(): Promise<void> {
    return this._queue.close();
  }
}
