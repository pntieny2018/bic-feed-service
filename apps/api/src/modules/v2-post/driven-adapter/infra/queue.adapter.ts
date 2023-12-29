import { QueueGroup, QueueName } from '@libs/infra/v2-queue';
import { Inject } from '@nestjs/common';

import {
  PUBLISHER_APPLICATION_SERVICE,
  IPublisherApplicationService,
} from '../../../queue-publisher/application/interface';
import {
  ContentScheduledJobDto,
  QuizGenerateJobDto,
  QuizParticipantResultJobDto,
} from '../../application/dto';
import { ContentScheduledJobPayload, IQueueAdapter } from '../../domain/infra-adapter-interface';

export class QueueAdapter implements IQueueAdapter {
  public constructor(
    @Inject(PUBLISHER_APPLICATION_SERVICE)
    private readonly _publisherAppService: IPublisherApplicationService
  ) {}

  public async hasJob(queueName: QueueName, jobId: string): Promise<boolean> {
    return this._publisherAppService.hasJob(queueName, jobId);
  }

  public async killJob(queueName: QueueName, jobId: string): Promise<void> {
    await this._publisherAppService.removeJob(queueName, jobId);
  }

  public async addQuizGenerateJob(quizId: string): Promise<void> {
    await this._publisherAppService.addJob<QuizGenerateJobDto>(QueueName.QUIZ_PENDING, {
      data: { quizId },
      opts: { group: { id: QueueGroup.QUIZ_PENDING_GROUP } },
    });
  }

  public async addQuizParticipantStartedJob(
    quizParticipantId: string,
    delayTime: number
  ): Promise<void> {
    await this._publisherAppService.addJob<QuizParticipantResultJobDto>(
      QueueName.QUIZ_PARTICIPANT_RESULT,
      {
        data: { quizParticipantId },
        opts: { jobId: quizParticipantId, delay: delayTime },
      }
    );
  }

  public async addContentScheduledJobs(payloads: ContentScheduledJobPayload[]): Promise<void> {
    await this._publisherAppService.addBulkJobs<ContentScheduledJobDto>(
      QueueName.CONTENT_SCHEDULED,
      payloads.map(({ contentId, ownerId }) => ({
        data: { contentId, ownerId },
        opts: { jobId: contentId },
      }))
    );
  }
}
