import { JobWithConfiguration, QueueName } from '@libs/infra/v2-queue';
import { Inject } from '@nestjs/common';

import { IPublisherDomainService, PUBLISHER_DOMAIN_SERVICE_TOKEN } from '../domain/interface';

import { IAppPublisherService } from './interface';

export class PublisherService implements IAppPublisherService {
  public constructor(
    @Inject(PUBLISHER_DOMAIN_SERVICE_TOKEN)
    private readonly _publisherDomainService: IPublisherDomainService
  ) {}

  public async hasJob(queue: QueueName, jobId: string): Promise<boolean> {
    return this._publisherDomainService.hasJob(queue, jobId);
  }

  public async addJob<T>(queue: QueueName, job: JobWithConfiguration<T>): Promise<void> {
    return this._publisherDomainService.addJob(queue, job);
  }

  public async addBulkJobs<T>(queue: QueueName, jobs: JobWithConfiguration<T>[]): Promise<void> {
    return this._publisherDomainService.addBulkJobs(queue, jobs);
  }

  public async removeJob(queue: QueueName, jobId: string): Promise<boolean> {
    return this._publisherDomainService.removeJob(queue, jobId);
  }
}
