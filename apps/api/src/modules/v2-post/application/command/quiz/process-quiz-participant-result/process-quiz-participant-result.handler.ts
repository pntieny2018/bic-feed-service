import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  IQuizDomainService,
  QUIZ_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import {
  IQuizParticipantRepository,
  QUIZ_PARTICIPANT_REPOSITORY_TOKEN,
} from '../../../../domain/repositoty-interface/quiz-participant.repository.interface';

import { ProcessQuizParticipantResultCommand } from './process-quiz-participant-result.command';

@CommandHandler(ProcessQuizParticipantResultCommand)
export class ProcessQuizParticipantResultHandler
  implements ICommandHandler<ProcessQuizParticipantResultCommand, void>
{
  public constructor(
    @Inject(QUIZ_PARTICIPANT_REPOSITORY_TOKEN)
    private readonly _quizParticipantRepository: IQuizParticipantRepository,
    @Inject(QUIZ_DOMAIN_SERVICE_TOKEN)
    private readonly _quizDomainService: IQuizDomainService
  ) {}

  public async execute(command: ProcessQuizParticipantResultCommand): Promise<void> {
    const { quizParticipantId } = command.payload;

    const quizParticipantEntity = await this._quizParticipantRepository.findQuizParticipantById(
      quizParticipantId
    );
    if (!quizParticipantEntity) {
      return;
    }

    const isOverTime = quizParticipantEntity.isOverTimeLimit();
    const isFinished = quizParticipantEntity.isFinished();

    if (isOverTime && !isFinished) {
      const startedAt = quizParticipantEntity.get('startedAt');
      const timeLimit = quizParticipantEntity.get('timeLimit');

      const finishedAt = new Date(startedAt.getTime() + timeLimit * 1000);

      quizParticipantEntity.setFinishedAt(finishedAt);
      await this._quizParticipantRepository.update(quizParticipantEntity);
    }

    await this._quizDomainService.calculateHighestScore(quizParticipantEntity);
  }
}
