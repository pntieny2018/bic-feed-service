import { IQueueService } from '@libs/infra/v2-queue';
import { JobsProOptions } from '@libs/infra/v2-queue/shared';
import { Job } from 'bullmq';

import { IPublisher } from '../../domain/infra-interface';

export class BasePublisher implements IPublisher {
  private readonly _queue: IQueueService;

  public constructor(_queue: IQueueService) {
    this._queue = _queue;
  }

  public async add<T>(job: T, opts?: JobsProOptions): Promise<void> {
    await this._queue.add(job, opts);
  }

  public async addBulk<T>(jobs: { data: T; opts?: JobsProOptions }[]): Promise<void> {
    await this._queue.addBulk(jobs);
  }

  public async remove(jobId: string): Promise<boolean> {
    return this._queue.remove(jobId);
  }

  public async get<T>(jobId: string): Promise<Job<T>> {
    return this._queue.get(jobId);
  }
}
