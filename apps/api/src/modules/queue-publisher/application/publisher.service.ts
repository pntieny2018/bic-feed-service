import { QueueName } from '@libs/infra/v2-queue';
import { Inject } from '@nestjs/common';
import { Job } from 'bullmq';

import {
  IPublisherDomainService,
  JobWithConfiguration,
  PUBLISHER_DOMAIN_SERVICE_TOKEN,
} from '../domain/interface';

import { IAppPublisherService } from './interface';

export class PublisherService implements IAppPublisherService {
  public constructor(
    @Inject(PUBLISHER_DOMAIN_SERVICE_TOKEN)
    private readonly _publisherDomainService: IPublisherDomainService
  ) {}

  public async addJob<T>(queue: QueueName, job: JobWithConfiguration<T>): Promise<void> {
    return this._publisherDomainService.addJob(queue, job);
  }

  public async addBulkJobs<T>(queue: QueueName, jobs: JobWithConfiguration<T>[]): Promise<void> {
    return this._publisherDomainService.addBulkJobs(queue, jobs);
  }

  public async getJob<T>(queue: QueueName, jobId: string): Promise<Job<T>> {
    return this._publisherDomainService.getJob(queue, jobId);
  }

  public async removeJob(queue: QueueName, jobId: string): Promise<boolean> {
    return this._publisherDomainService.removeJob(queue, jobId);
  }
}
