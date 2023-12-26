import { QueueGroup, QueueName } from '@libs/infra/v2-queue';
import { Inject } from '@nestjs/common';

import {
  PUBLISHER_APPLICATION_SERVICE,
  IPublisherApplicationService,
} from '../../../queue-publisher/application/interface';
import { QuizGenerateJobDto, QuizParticipantResultJobDto } from '../../application/dto';
import {
  IQueueAdapter,
  ProducerAttachDetachNewsfeedJobPayload,
} from '../../domain/infra-adapter-interface';

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

  public async addProducerAttachDetachNewsfeedJob(
    payload: ProducerAttachDetachNewsfeedJobPayload
  ): Promise<void> {
    const { contentId } = payload;
    await this._publisherAppService.addJob<ProducerAttachDetachNewsfeedJobPayload>(
      QueueName.PRODUCER_ATTACH_DETACH_NEWSFEED,
      {
        data: payload,
        opts: { group: { id: contentId } },
      }
    );
  }
}
