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
}
