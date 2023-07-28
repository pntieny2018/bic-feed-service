import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  IQuizDomainService,
  QUIZ_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { StartQuizCommand } from './start-quiz.command';
import { IQuizRepository, QUIZ_REPOSITORY_TOKEN } from '../../../domain/repositoty-interface';
import { QuizNotFoundException } from '../../../domain/exception';
import {
  IQuizParticipantRepository,
  QUIZ_PARTICIPANT_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface/quiz-participant.repository.interface';
import { QuizParticipantNotFinishedException } from '../../../domain/exception/quiz-participant-not-finished.exception';

@CommandHandler(StartQuizCommand)
export class StartQuizHandler implements ICommandHandler<StartQuizCommand, string> {
  public constructor(
    @Inject(QUIZ_DOMAIN_SERVICE_TOKEN)
    private readonly _quizDomainService: IQuizDomainService,
    @Inject(QUIZ_REPOSITORY_TOKEN)
    private readonly _quizRepository: IQuizRepository,
    @Inject(QUIZ_PARTICIPANT_REPOSITORY_TOKEN)
    private readonly _quizParticipantRepository: IQuizParticipantRepository
  ) {}
  public async execute(command: StartQuizCommand): Promise<string> {
    const { authUser, quizId } = command.payload;

    const quizEntity = await this._quizRepository.findOne({
      where: {
        id: quizId,
      },
    });

    if (!quizEntity || !quizEntity.isPublished()) {
      throw new QuizNotFoundException();
    }

    const quizParticipantEntities = await this._quizParticipantRepository.findAllByContentId(
      quizEntity.get('contentId'),
      authUser.id
    );

    const hasQuizDoing = quizParticipantEntities.some(
      (quizParticipantEntity) =>
        !quizParticipantEntity.isOverLimitTime() && !quizParticipantEntity.isFinished()
    );

    if (hasQuizDoing) {
      throw new QuizParticipantNotFinishedException();
    }
    const takeQuiz = await this._quizDomainService.startQuiz(quizEntity, authUser);

    return takeQuiz.get('id');
  }
}
