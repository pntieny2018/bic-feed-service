import { JobWithConfiguration, QueueName } from '@libs/infra/v2-queue';
import { Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

import {
  PUBLISH_REMOVE_CONTENT_PUBLISHER_TOKEN,
  QUIZ_PARTICIPANT_PUBLISHER_TOKEN,
  QUIZ_PENDING_PUBLISHER_TOKEN,
} from '../provider';

import { IPublisher } from './infra-interface';
import { IPublisherDomainService } from './interface';

@Injectable()
export class PublisherDomainService implements IPublisherDomainService {
  private readonly _logger = new Logger(PublisherDomainService.name);

  public constructor(protected readonly moduleRef: ModuleRef) {}

  public getPublisherToken(queueName: QueueName): string {
    switch (queueName) {
      case QueueName.QUIZ_PENDING:
        return QUIZ_PENDING_PUBLISHER_TOKEN;
      case QueueName.QUIZ_PARTICIPANT_RESULT:
        return QUIZ_PARTICIPANT_PUBLISHER_TOKEN;
      case QueueName.PUBLISH_OR_REMOVE_CONTENT_TO_NEWSFEED:
        return PUBLISH_REMOVE_CONTENT_PUBLISHER_TOKEN;
      default:
        throw new Error(`Unknown queue name: ${queueName}`);
    }
  }

  public factoryMethod(queue: QueueName): IPublisher {
    return this.moduleRef.get<IPublisher>(this.getPublisherToken(queue), {
      strict: false,
    });
  }

  public async hasJob(queue: QueueName, jobId: string): Promise<boolean> {
    const publisher = this.factoryMethod(queue);
    return publisher.has(jobId);
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

  public async removeJob(queue: QueueName, jobId: string): Promise<boolean> {
    const publisher = this.factoryMethod(queue);
    const result = publisher.remove(jobId);
    this._logger.debug(`Remove job from queue ${queue}, jobId: ${jobId}`);
    return result;
  }
}
