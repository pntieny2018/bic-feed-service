import { Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Job } from 'bullmq';

import { QueueName } from '../data-type';
import { IPublisher } from '../domain/infra-interface';
import { queueNameToToken } from '../utils';

import { IPublisherFactoryService, JobWithConfiguration } from './interface';

@Injectable()
export class PublisherFactoryService implements IPublisherFactoryService {
  private readonly _logger = new Logger(PublisherFactoryService.name);

  public constructor(protected readonly moduleRef: ModuleRef) {}

  public factoryMethod(queue: QueueName): IPublisher {
    return this.moduleRef.get<IPublisher>(queueNameToToken(queue), { strict: false });
  }

  public async addJob<T>(queue: QueueName, job: JobWithConfiguration<T>): Promise<void> {
    const { data, opts } = job;
    const publisher = this.factoryMethod(queue);
    await publisher.add(data, opts);
    this._logger.debug(`Added a job to queue ${queue}`);
  }

  public async addBulkJobs<T>(queue: QueueName, jobs: JobWithConfiguration<T>[]): Promise<void> {
    const publisher = this.factoryMethod(queue);
    await publisher.addBulk(jobs);
    this._logger.debug(`Added ${jobs.length} jobs to queue ${queue}`);
  }

  public async getJob<T>(queue: QueueName, jobId: string): Promise<Job<T>> {
    const publisher = this.factoryMethod(queue);
    const job = await publisher.get<T>(jobId);
    this._logger.debug(`Get job in queue ${queue}, jobId: ${jobId}`);
    return job;
  }

  public async removeJob(queue: QueueName, jobId: string): Promise<boolean> {
    const publisher = this.factoryMethod(queue);
    const result = publisher.remove(jobId);
    this._logger.debug(`Remove job from queue ${queue}, jobId: ${jobId}`);
    return result;
  }
}
