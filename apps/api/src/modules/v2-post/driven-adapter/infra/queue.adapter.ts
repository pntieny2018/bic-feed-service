import { QueueGroup, QueueName } from '@libs/infra/v2-queue';
import { Inject } from '@nestjs/common';

import {
  APPLICATION_PUBLISHER_SERVICE,
  IAppPublisherService,
} from '../../../queue-publisher/application/interface';
import {
  ContentScheduledJobDto,
  QuizGenerateJobDto,
  QuizParticipantResultJobDto,
} from '../../application/dto';
import { ContentScheduledJobPayload, IQueueAdapter } from '../../domain/infra-adapter-interface';

export class QueueAdapter implements IQueueAdapter {
  public constructor(
    @Inject(APPLICATION_PUBLISHER_SERVICE)
    private readonly _appPublisherService: IAppPublisherService
  ) {}

  public async hasJob(queueName: QueueName, jobId: string): Promise<boolean> {
    return this._appPublisherService.hasJob(queueName, jobId);
  }

  public async killJob(queueName: QueueName, jobId: string): Promise<void> {
    await this._appPublisherService.removeJob(queueName, jobId);
  }

  public async addQuizGenerateJob(quizId: string): Promise<void> {
    await this._appPublisherService.addJob<QuizGenerateJobDto>(QueueName.QUIZ_PENDING, {
      data: { quizId },
      opts: { group: { id: QueueGroup.QUIZ_PENDING_GROUP } },
    });
  }

  public async addQuizParticipantStartedJob(
    quizParticipantId: string,
    delayTime: number
  ): Promise<void> {
    await this._appPublisherService.addJob<QuizParticipantResultJobDto>(
      QueueName.QUIZ_PARTICIPANT_RESULT,
      {
        data: { quizParticipantId },
        opts: { jobId: quizParticipantId, delay: delayTime },
      }
    );
  }

  public async addContentScheduledJobs(payloads: ContentScheduledJobPayload[]): Promise<void> {
    await this._appPublisherService.addBulkJobs<ContentScheduledJobDto>(
      QueueName.CONTENT_SCHEDULED,
      payloads.map(({ contentId, ownerId }) => ({
        data: { contentId, ownerId },
        opts: { jobId: contentId },
      }))
    );
  }
}
