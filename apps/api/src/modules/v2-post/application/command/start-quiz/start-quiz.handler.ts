import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  IQuizDomainService,
  QUIZ_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import {
  QuizNotFoundException,
  QuizParticipantNotFinishedException,
} from '../../../domain/exception';
import { IQuizRepository, QUIZ_REPOSITORY_TOKEN } from '../../../domain/repositoty-interface';
import {
  IQuizParticipantRepository,
  QUIZ_PARTICIPANT_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface/quiz-participant.repository.interface';

import { StartQuizCommand } from './start-quiz.command';

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

    const quizEntity = await this._quizRepository.findQuizWithQuestions(quizId);

    if (!quizEntity || !quizEntity.isPublished()) {
      throw new QuizNotFoundException();
    }

    const quizParticipantEntities = await this._quizParticipantRepository.findAllByContentId(
      quizEntity.get('contentId'),
      authUser.id
    );

    const hasQuizDoing = quizParticipantEntities.filter(
      (quizParticipantEntity) =>
        !quizParticipantEntity.isOverTimeLimit() && !quizParticipantEntity.isFinished()
    );

    if (hasQuizDoing.length) {
      throw new QuizParticipantNotFinishedException(null, {
        quizDoing: {
          id: hasQuizDoing[0].get('id'),
        },
      });
    }
    const takeQuiz = await this._quizDomainService.startQuiz(quizEntity, authUser);

    return takeQuiz.get('id');
  }
}
