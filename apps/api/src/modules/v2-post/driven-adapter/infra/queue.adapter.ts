import { QUEUES } from '@libs/common/constants';
import { IQueueService, QUEUE_SERVICE_TOKEN } from '@libs/infra/queue';
import { Inject } from '@nestjs/common';

import { ArticleScheduledJobDto, QuizParticipantResultJobDto } from '../../application/dto';
import { ArticleScheduledJobPayload, IQueueAdapter } from '../../domain/infra-adapter-interface';

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

  public async addArticleScheduledJobs(payloads: ArticleScheduledJobPayload[]): Promise<void> {
    await this._queueService.addBulkJobs<ArticleScheduledJobDto>(
      payloads.map(({ articleId, articleOwner }) => ({
        name: QUEUES.ARTICLE_SCHEDULED.JOBS.PROCESS_ARTICLE_SCHEDULED,
        data: { articleId, articleOwner },
        opts: { jobId: articleId },
        queue: { name: QUEUES.ARTICLE_SCHEDULED.QUEUE_NAME },
      }))
    );
  }
}
