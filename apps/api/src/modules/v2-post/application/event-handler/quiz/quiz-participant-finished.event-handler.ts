import { EventsHandlerAndLog } from '@libs/infra/log';
import { QueueName } from '@libs/infra/v2-queue';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import {
  IQuizDomainService,
  QUIZ_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { QuizParticipantFinishedEvent } from '../../../domain/event';
import { IQueueAdapter, QUEUE_ADAPTER } from '../../../domain/infra-adapter-interface';
import {
  IQuizParticipantRepository,
  QUIZ_PARTICIPANT_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface/quiz-participant.repository.interface';

@EventsHandlerAndLog(QuizParticipantFinishedEvent)
export class QuizParticipantFinishedEventHandler
  implements IEventHandler<QuizParticipantFinishedEvent>
{
  public constructor(
    @Inject(QUEUE_ADAPTER)
    private readonly _queueAdapter: IQueueAdapter,
    @Inject(QUIZ_DOMAIN_SERVICE_TOKEN)
    private readonly _quizDomainService: IQuizDomainService,
    @Inject(QUIZ_PARTICIPANT_REPOSITORY_TOKEN)
    private readonly _quizParticipantRepository: IQuizParticipantRepository
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
    const isExist = await this._queueAdapter.hasJob(
      QueueName.QUIZ_PARTICIPANT_RESULT,
      quizParticipantId
    );
    if (isExist) {
      await this._queueAdapter.killJob(QueueName.QUIZ_PARTICIPANT_RESULT, quizParticipantId);
    }

    await this._quizDomainService.calculateHighestScore(quizParticipantEntity);
  }
}
