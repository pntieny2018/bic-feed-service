import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  IQuizDomainService,
  QUIZ_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import {
  IQuizParticipantRepository,
  QUIZ_PARTICIPANT_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface/quiz-participant.repository.interface';
import { ProcessQuizParticipantResultCommand } from './process-quiz-participant-result.command';
import { RULES } from '../../../constant';

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

    const quizParticipantEntity = await this._quizParticipantRepository.findOne(quizParticipantId);
    if (!quizParticipantEntity) return;

    const isFinished =
      quizParticipantEntity.isOverTimeLimit() || quizParticipantEntity.isFinished();
    if (!isFinished) {
      const delayJobAmount =
        (quizParticipantEntity.get('timeLimit') + RULES.QUIZ_TIME_LIMIT_BUFFER) * 1000;
      await this._quizDomainService.createQuizParticipantResultJob(
        quizParticipantId,
        delayJobAmount
      );
    } else {
      await this._quizDomainService.calculateHighestScore(quizParticipantEntity);
    }
  }
}
