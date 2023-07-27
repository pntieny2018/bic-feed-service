import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  IQuizDomainService,
  QUIZ_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { UpdateQuizAnswerCommand } from './update-quiz-answer.command';
import { QuizOverTimeException, QuizParticipantNotFoundException } from '../../../domain/exception';
import {
  IQuizParticipantRepository,
  QUIZ_PARTICIPANT_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface/quiz-participant.repository.interface';

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

    const quizParticipantEntity = await this._quizParticipantRepository.findOne(quizParticipantId);

    if (!quizParticipantEntity) {
      throw new QuizParticipantNotFoundException();
    }

    if (!quizParticipantEntity.isOwner(authUser.id)) {
      throw new QuizParticipantNotFoundException();
    }

    if (quizParticipantEntity.isOverLimitTime()) {
      throw new QuizOverTimeException();
    }

    quizParticipantEntity.updateAnswers(answers);
    if (isFinished) quizParticipantEntity.setFinishedAt();
    await this._quizParticipantRepository.update(quizParticipantEntity);
  }
}
