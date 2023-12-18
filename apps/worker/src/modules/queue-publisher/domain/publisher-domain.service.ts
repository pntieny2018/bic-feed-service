import { JobWithConfiguration, QueueName } from '@libs/infra/v2-queue';
import { Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

import { CONTENT_SCHEDULED_PUBLISHER_TOKEN } from '../provider';

import { IPublisher } from './infra-interface';
import { IPublisherDomainService } from './interface';

@Injectable()
export class PublisherDomainService implements IPublisherDomainService {
  private readonly _logger = new Logger(PublisherDomainService.name);

  public constructor(protected readonly moduleRef: ModuleRef) {}

  public getPublisherToken(queueName: QueueName): string {
    switch (queueName) {
      case QueueName.CONTENT_SCHEDULED:
        return CONTENT_SCHEDULED_PUBLISHER_TOKEN;
      default:
        throw new Error(`Unknown queue name: ${queueName}`);
    }
  }

  public factoryMethod(queue: QueueName): IPublisher {
    return this.moduleRef.get<IPublisher>(this.getPublisherToken(queue), {
      strict: false,
    });
  }

  public async addJob<T>(queue: QueueName, job: JobWithConfiguration<T>): Promise<void> {
    const publisher = this.factoryMethod(queue);
    await publisher.add(job);
    this._logger.debug(`Added a job to queue ${queue}`);
  }

  public async addBulkJobs<T>(queue: QueueName, jobs: JobWithConfiguration<T>[]): Promise<void> {
    const publisher = this.factoryMethod(queue);
    await publisher.addBulk(jobs);
    this._logger.debug(`Added ${jobs.length} jobs to queue ${queue}`);
  }
}
