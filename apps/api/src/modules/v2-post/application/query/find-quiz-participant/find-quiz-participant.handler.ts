import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { FindQuizParticipantQuery } from './find-quiz-participant.query';
import { IQuizBinding, QUIZ_BINDING_TOKEN } from '../../binding/binding-quiz/quiz.interface';
import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
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
import { UserDto } from '../../../../v2-user/application';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import { ContentEntity } from '../../../domain/model/content';

@QueryHandler(FindQuizParticipantQuery)
export class FindQuizParticipantHandler
  implements IQueryHandler<FindQuizParticipantQuery, QuizParticipantDto>
{
  public constructor(
    private readonly _queryBus: QueryBus,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService,
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

    const contentEntity = await this._contentDomainService.getVisibleContent(
      quizParticipantEntity.get('contentId')
    );
    return this._entityToDto(quizParticipantEntity, contentEntity, authUser);
  }

  private async _entityToDto(
    quizParticipantEntity: QuizParticipantEntity,
    contentEntity: ContentEntity,
    authUser: UserDto
  ): Promise<QuizParticipantDto> {
    const attributes: QuizParticipantDto = {
      id: quizParticipantEntity.get('id'),
      title: quizParticipantEntity.get('quizSnapshot').title,
      description: quizParticipantEntity.get('quizSnapshot').description,
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
      content: {
        id: contentEntity.get('id'),
        type: contentEntity.get('type'),
      },
      timeLimit: quizParticipantEntity.get('timeLimit'),
      startedAt: quizParticipantEntity.get('startedAt'),
      createdAt: quizParticipantEntity.get('createdAt'),
      updatedAt: quizParticipantEntity.get('updatedAt'),
    };

    if (quizParticipantEntity.isOverLimitTime() || quizParticipantEntity.isFinished()) {
      const quizParticipantEntities = await this._quizParticipantRepository.findAllByContentId(
        quizParticipantEntity.get('contentId'),
        authUser.id
      );
      attributes.totalTimes = quizParticipantEntities.length;
      attributes.score = quizParticipantEntity.get('score');
      attributes.totalAnswers = quizParticipantEntity.get('totalAnswers');
      attributes.totalCorrectAnswers = quizParticipantEntity.get('totalCorrectAnswers');
      attributes.finishedAt = quizParticipantEntity.get('finishedAt');
    }
    return new QuizParticipantDto(attributes);
  }
}
