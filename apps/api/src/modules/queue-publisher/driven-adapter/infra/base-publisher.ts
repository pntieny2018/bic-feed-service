import { IQueueService, JobWithConfiguration } from '@libs/infra/v2-queue';

import { IPublisher } from '../../domain/infra-interface';

export class BasePublisher implements IPublisher {
  private readonly _queue: IQueueService;

  public constructor(_queue: IQueueService) {
    this._queue = _queue;
  }

  public async add<T>(job: JobWithConfiguration<T>): Promise<void> {
    await this._queue.add(job);
  }

  public async addBulk<T>(jobs: JobWithConfiguration<T>[]): Promise<void> {
    await this._queue.addBulk(jobs);
  }

  public async remove(jobId: string): Promise<boolean> {
    return this._queue.remove(jobId);
  }

  public async has(jobId: string): Promise<boolean> {
    return this._queue.has(jobId);
  }
}
