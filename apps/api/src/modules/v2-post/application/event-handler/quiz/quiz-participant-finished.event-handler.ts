import { QueueService } from '@app/queue';
import { QUEUES } from '@app/queue/queue.constant';
import { Inject, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import {
  IQuizDomainService,
  QUIZ_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { QuizParticipantFinishedEvent } from '../../../domain/event';
import {
  IQuizParticipantRepository,
  QUIZ_PARTICIPANT_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface/quiz-participant.repository.interface';

@EventsHandler(QuizParticipantFinishedEvent)
export class QuizParticipantFinishedEventHandler
  implements IEventHandler<QuizParticipantFinishedEvent>
{
  private readonly _logger = new Logger(QuizParticipantFinishedEventHandler.name);
  public constructor(
    @Inject(QUIZ_DOMAIN_SERVICE_TOKEN)
    private readonly _quizDomainService: IQuizDomainService,
    @Inject(QUIZ_PARTICIPANT_REPOSITORY_TOKEN)
    private readonly _quizParticipantRepository: IQuizParticipantRepository,
    private readonly _queueService: QueueService
  ) {}

  public async handle(event: QuizParticipantFinishedEvent): Promise<void> {
    this._logger.debug(`EventHandler: ${JSON.stringify(event)}`);

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
