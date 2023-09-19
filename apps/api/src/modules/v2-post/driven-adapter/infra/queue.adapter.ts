import { QUEUES } from '@libs/common/constants';
import { IQueueService, QUEUE_SERVICE_TOKEN } from '@libs/infra/queue';
import { Inject } from '@nestjs/common';

import { ContentScheduledJobDto, QuizParticipantResultJobDto } from '../../application/dto';
import { ContentScheduledJobPayload, IQueueAdapter } from '../../domain/infra-adapter-interface';

export class QueueAdapter implements IQueueAdapter {
  public constructor(
    @Inject(QUEUE_SERVICE_TOKEN)
    private readonly _queueService: IQueueService
  ) {}

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
    await this._queueService.addBulkJobs<ContentScheduledJobDto>(
      payloads.map(({ contentId, ownerId }) => ({
        name: QUEUES.CONTENT_SCHEDULED.JOBS.PROCESS_CONTENT_SCHEDULED,
        data: { contentId, ownerId },
        opts: { jobId: contentId },
        queue: { name: QUEUES.CONTENT_SCHEDULED.QUEUE_NAME },
      }))
    );
  }
}
