import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  IQuizDomainService,
  QUIZ_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import { ContentAccessDeniedException } from '../../../../domain/exception';
import {
  IQuizParticipantRepository,
  QUIZ_PARTICIPANT_REPOSITORY_TOKEN,
} from '../../../../domain/repositoty-interface/quiz-participant.repository.interface';

import { UpdateQuizAnswerCommand } from './update-quiz-answer.command';

@CommandHandler(UpdateQuizAnswerCommand)
export class UpdateQuizAnswerHandler implements ICommandHandler<UpdateQuizAnswerCommand, void> {
  public constructor(
    @Inject(QUIZ_DOMAIN_SERVICE_TOKEN)
    private readonly _quizDomainService: IQuizDomainService,
    @Inject(QUIZ_PARTICIPANT_REPOSITORY_TOKEN)
    private readonly _quizParticipantRepository: IQuizParticipantRepository
  ) {}
  public async execute(command: UpdateQuizAnswerCommand): Promise<void> {
    const { quizParticipantId, authUser, answers, isFinished } = command.payload;

    const quizParticipantEntity = await this._quizParticipantRepository.getQuizParticipantById(
      quizParticipantId
    );

    if (!quizParticipantEntity.isOwner(authUser.id)) {
      throw new ContentAccessDeniedException();
    }

    await this._quizDomainService.updateQuizAnswers(quizParticipantEntity, answers, isFinished);
  }
}
