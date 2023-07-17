import { Inject } from '@nestjs/common';
import { QuizDto } from '../../dto';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { FindQuizQuery } from './find-quiz.query';
import { IQuizBinding, QUIZ_BINDING_TOKEN } from '../../binding/binding-quiz/quiz.interface';
import {
  IQuizDomainService,
  QUIZ_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';

@QueryHandler(FindQuizQuery)
export class FindQuizHandler implements IQueryHandler<FindQuizQuery, QuizDto> {
  public constructor(
    private readonly _queryBus: QueryBus,
    @Inject(QUIZ_DOMAIN_SERVICE_TOKEN)
    private readonly _quizDomainService: IQuizDomainService,
    @Inject(QUIZ_BINDING_TOKEN)
    private readonly _quizBinding: IQuizBinding
  ) {}

  public async execute(query: FindQuizQuery): Promise<QuizDto> {
    const { authUser, quizId } = query.payload;

    const quizEntity = await this._quizDomainService.getQuiz(quizId, authUser);
    return this._quizBinding.binding(quizEntity);
  }
}
