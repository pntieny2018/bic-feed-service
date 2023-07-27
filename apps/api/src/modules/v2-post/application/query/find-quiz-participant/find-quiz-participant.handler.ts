import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { FindQuizParticipantQuery } from './find-quiz-participant.query';
import { IQuizBinding, QUIZ_BINDING_TOKEN } from '../../binding/binding-quiz/quiz.interface';
import {
  IQuizDomainService,
  QUIZ_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import {
  IQuizParticipantRepository,
  QUIZ_PARTICIPANT_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface/quiz-participant.repository.interface';
import { QuizParticipantDto } from '../../dto/quiz-participant.dto';
import { QuizParticipantEntity } from '../../../domain/model/quiz-participant';
import { QuizParticipantNotFoundException } from '../../../domain/exception';

@QueryHandler(FindQuizParticipantQuery)
export class FindQuizParticipantHandler
  implements IQueryHandler<FindQuizParticipantQuery, QuizParticipantDto>
{
  public constructor(
    private readonly _queryBus: QueryBus,
    @Inject(QUIZ_DOMAIN_SERVICE_TOKEN)
    private readonly _quizDomainService: IQuizDomainService,
    @Inject(QUIZ_PARTICIPANT_REPOSITORY_TOKEN)
    private readonly _quizParticipantRepository: IQuizParticipantRepository,
    @Inject(QUIZ_BINDING_TOKEN)
    private readonly _quizBinding: IQuizBinding
  ) {}

  public async execute(query: FindQuizParticipantQuery): Promise<QuizParticipantDto> {
    const { authUser, quizParticipantId } = query.payload;

    const quizParticipantEntity = await this._quizParticipantRepository.findOne(quizParticipantId);
    if (!quizParticipantEntity) {
      throw new QuizParticipantNotFoundException();
    }

    if (!quizParticipantEntity.isOwner(authUser.id)) {
      throw new QuizParticipantNotFoundException();
    }

    return this._entityToDto(quizParticipantEntity);
  }

  private async _entityToDto(
    quizParticipantEntity: QuizParticipantEntity
  ): Promise<QuizParticipantDto> {
    const attributes: QuizParticipantDto = {
      id: quizParticipantEntity.get('id'),
      questions: quizParticipantEntity.get('quizSnapshot').questions.map((question) => ({
        id: question.id,
        content: question.content,
        answers: question.answers.map((answer) => ({
          id: answer.id,
          content: answer.content,
        })),
      })),
      userAnswers: quizParticipantEntity.get('answers').map((answer) => ({
        questionId: answer.questionId,
        answerId: answer.answerId,
      })),
      quizId: quizParticipantEntity.get('quizId'),
      contentId: quizParticipantEntity.get('contentId'),
      timeLimit: quizParticipantEntity.get('timeLimit'),
      startedAt: quizParticipantEntity.get('startedAt'),
      createdAt: quizParticipantEntity.get('createdAt'),
      updatedAt: quizParticipantEntity.get('updatedAt'),
    };

    if (quizParticipantEntity.isOverLimitTime() || quizParticipantEntity.isFinished()) {
      attributes.score = quizParticipantEntity.get('score');
      attributes.totalAnswers = quizParticipantEntity.get('totalAnswers');
      attributes.totalCorrectAnswers = quizParticipantEntity.get('totalCorrectAnswers');
      attributes.finishedAt = quizParticipantEntity.get('finishedAt');
    }
    return new QuizParticipantDto(attributes);
  }
}
