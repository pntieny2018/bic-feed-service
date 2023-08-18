import { QUEUES } from '@libs/common/constants';
import { EventsHandlerAndLog } from '@libs/infra/log';
import { IQueueService, QUEUE_SERVICE_TOKEN } from '@libs/infra/queue';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import { RULES } from '../../constant';
import {
  IQuizDomainService,
  QUIZ_DOMAIN_SERVICE_TOKEN,
} from '../../domain/domain-service/interface';
import { QuizParticipantFinishedEvent, QuizParticipantStartedEvent } from '../../domain/event';
import {
  IQuizParticipantRepository,
  QUIZ_PARTICIPANT_REPOSITORY_TOKEN,
} from '../../domain/repositoty-interface/quiz-participant.repository.interface';
import { QuizParticipantResultJobDto } from '../dto/queue.dto';

@EventsHandlerAndLog(QuizParticipantStartedEvent)
export class QuizParticipantStartedEventHandler
  implements IEventHandler<QuizParticipantStartedEvent>
{
  public constructor(
    @Inject(QUEUE_SERVICE_TOKEN)
    private readonly _queueService: IQueueService
  ) {}

  public async handle(event: QuizParticipantStartedEvent): Promise<void> {
    const { quizParticipantId, timeLimit } = event.payload;
    const delay = (timeLimit + RULES.QUIZ_TIME_LIMIT_BUFFER) * 1000;

    await this._queueService.addBulkJobs<QuizParticipantResultJobDto>([
      {
        name: QUEUES.QUIZ_PARTICIPANT_RESULT.JOBS.PROCESS_QUIZ_PARTICIPANT_RESULT,
        data: { quizParticipantId },
        opts: { delay, jobId: quizParticipantId },
        queue: { name: QUEUES.QUIZ_PARTICIPANT_RESULT.QUEUE_NAME },
      },
    ]);
  }
}

@EventsHandlerAndLog(QuizParticipantFinishedEvent)
export class QuizParticipantFinishedEventHandler
  implements IEventHandler<QuizParticipantFinishedEvent>
{
  public constructor(
    @Inject(QUIZ_DOMAIN_SERVICE_TOKEN)
    private readonly _quizDomainService: IQuizDomainService,
    @Inject(QUIZ_PARTICIPANT_REPOSITORY_TOKEN)
    private readonly _quizParticipantRepository: IQuizParticipantRepository,
    @Inject(QUEUE_SERVICE_TOKEN)
    private readonly _queueService: IQueueService
  ) {}

  public async handle(event: QuizParticipantFinishedEvent): Promise<void> {
    const { quizParticipantId } = event.payload;

    const quizParticipantEntity = await this._quizParticipantRepository.findQuizParticipantById(
      quizParticipantId
    );
    if (!quizParticipantEntity) {
      return;
    }

    // If member submit quiz before time limit, delete current job
    const currentJob = await this._queueService.getJobById(
      QUEUES.QUIZ_PARTICIPANT_RESULT.QUEUE_NAME,
      quizParticipantId
    );
    if (currentJob) {
      await this._queueService.killJob(QUEUES.QUIZ_PARTICIPANT_RESULT.QUEUE_NAME, currentJob.id);
    }

    await this._quizDomainService.calculateHighestScore(quizParticipantEntity);
  }
}
