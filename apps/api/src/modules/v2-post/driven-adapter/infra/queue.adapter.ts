import { QUEUES } from '@libs/common/constants';
import { IQueueService, Job, QUEUE_SERVICE_TOKEN } from '@libs/infra/queue';
import { QueueName } from '@libs/infra/v2-queue';
import { Inject } from '@nestjs/common';
import { JobId } from 'bull';

import {
  IPublisherFactoryService,
  PUBLISHER_FACTORY_SERVICE,
} from '../../../queue-publisher/application/interface';
import {
  ContentScheduledJobDto,
  QuizGenerateJobDto,
  QuizParticipantResultJobDto,
} from '../../application/dto';
import { ContentScheduledJobPayload, IQueueAdapter } from '../../domain/infra-adapter-interface';

export class QueueAdapter implements IQueueAdapter {
  public constructor(
    @Inject(QUEUE_SERVICE_TOKEN)
    private readonly _queueService: IQueueService,
    @Inject(PUBLISHER_FACTORY_SERVICE)
    private readonly _publisherFactoryService: IPublisherFactoryService
  ) {}

  public async getJobById<T>(queueName: string, jobId: JobId): Promise<Job<T>> {
    return this._queueService.getJobById(queueName, jobId);
  }

  public async killJob(queueName: string, jobId: JobId): Promise<void> {
    await this._queueService.killJob(queueName, jobId);
  }

  public async addQuizGenerateJob(quizId: string): Promise<void> {
    await this._queueService.addBulkJobs<QuizGenerateJobDto>([
      {
        name: QUEUES.QUIZ_PENDING.JOBS.PROCESS_QUIZ_PENDING,
        data: { quizId },
        opts: {},
        queue: { name: QUEUES.QUIZ_PENDING.QUEUE_NAME },
      },
    ]);
  }

  public async addQuizParticipantStartedJob(
    quizParticipantId: string,
    delayTime: number
  ): Promise<void> {
    await this._queueService.addBulkJobs<QuizParticipantResultJobDto>([
      {
        name: QUEUES.QUIZ_PARTICIPANT_RESULT.JOBS.PROCESS_QUIZ_PARTICIPANT_RESULT,
        data: { quizParticipantId },
        opts: { jobId: quizParticipantId, delay: delayTime },
        queue: { name: QUEUES.QUIZ_PARTICIPANT_RESULT.QUEUE_NAME },
      },
    ]);
  }

  public async addContentScheduledJobs(payloads: ContentScheduledJobPayload[]): Promise<void> {
    await this._publisherFactoryService.addBulkJobs<ContentScheduledJobDto>(
      QueueName.CONTENT_SCHEDULED,
      payloads.map(({ contentId, ownerId }) => ({
        data: { contentId, ownerId },
        opts: { jobId: contentId },
      }))
    );
  }
}
