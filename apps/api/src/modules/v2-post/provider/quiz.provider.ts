import { TAG_QUERY_TOKEN } from '../domain/query-interface';
import { QUIZ_REPOSITORY_TOKEN } from '../domain/repositoty-interface';
import { TagQuery } from '../driven-adapter/query';
import { QuizRepository } from '../driven-adapter/repository/quiz.repository';
import { QUIZ_DOMAIN_SERVICE_TOKEN } from '../domain/domain-service/interface/quiz.domain-service.interface';
import { QuizDomainService } from '../domain/domain-service/quiz.domain-service';
import { QUIZ_FACTORY_TOKEN } from '../domain/factory/interface/quiz.factory.interface';
import { QuizFactory } from '../domain/factory/quiz.factory';
import { CreateQuizHandler } from '../application/command/create-quiz/create-quiz.handler';
import { QuizValidator } from '../domain/validator/quiz.validator';
import { QUIZ_VALIDATOR_TOKEN } from '../domain/validator/interface';
import { OPEN_AI_SERVICE_TOKEN } from '@app/openai/openai.service.interface';
import { OpenaiService } from '@app/openai';

export const quizProvider = [
  {
    provide: QUIZ_REPOSITORY_TOKEN,
    useClass: QuizRepository,
  },
  {
    provide: TAG_QUERY_TOKEN,
    useClass: TagQuery,
  },
  {
    provide: QUIZ_DOMAIN_SERVICE_TOKEN,
    useClass: QuizDomainService,
  },
  {
    provide: QUIZ_FACTORY_TOKEN,
    useClass: QuizFactory,
  },
  {
    provide: QUIZ_VALIDATOR_TOKEN,
    useClass: QuizValidator,
  },
  {
    provide: OPEN_AI_SERVICE_TOKEN,
    useClass: OpenaiService,
  },
  /** Application */
  CreateQuizHandler,
];
