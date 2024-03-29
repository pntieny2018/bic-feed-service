import { TAG_QUERY_TOKEN } from '../domain/query-interface';
import { QUIZ_REPOSITORY_TOKEN } from '../domain/repositoty-interface';
import { TagQuery } from '../driven-adapter/query';
import { QuizRepository } from '../driven-adapter/repository/quiz.repository';
import { QUIZ_DOMAIN_SERVICE_TOKEN } from '../domain/domain-service/interface';
import { QuizDomainService } from '../domain/domain-service/quiz.domain-service';
import { QUIZ_FACTORY_TOKEN } from '../domain/factory/interface/quiz.factory.interface';
import { QuizFactory } from '../domain/factory/quiz.factory';
import { CreateQuizHandler } from '../application/command/create-quiz/create-quiz.handler';
import { QuizValidator } from '../domain/validator/quiz.validator';
import { QUIZ_VALIDATOR_TOKEN } from '../domain/validator/interface';
import { OPEN_AI_SERVICE_TOKEN } from '@app/openai/openai.service.interface';
import { OpenaiService } from '@app/openai';
import { GenerateQuizHandler } from '../application/command/generate-quiz/generate-quiz.handler';
import { UpdateQuizHandler } from '../application/command/update-quiz/update-quiz.handler';
import { FindQuizzesHandler } from '../application/query/find-quizzes/find-quizzes.handler';
import { QUIZ_BINDING_TOKEN } from '../application/binding/binding-quiz/quiz.interface';
import { QuizBinding } from '../application/binding/binding-quiz/quiz.binding';
import { ProcessGenerationQuizHandler } from '../application/command/process-generation-quiz/process-generation-quiz.handler';
import { FindQuizHandler } from '../application/query/find-quiz/find-quiz.handler';
import {
  QuizCreatedEventHandler,
  QuizGeneratedEventHandler,
  QuizRegenerateEventHandler,
} from '../application/event-handler';
import { DeleteQuizHandler } from '../application/command/delete-quiz/delete-quiz.handler';
import { StartQuizHandler } from '../application/command/start-quiz/start-quiz.handler';
import { QUIZ_PARTICIPANT_REPOSITORY_TOKEN } from '../domain/repositoty-interface/quiz-participant.repository.interface';
import { QuizParticipantRepository } from '../driven-adapter/repository/quiz-participant.repository';
import { UpdateQuizAnswerHandler } from '../application/command/update-quiz-answer/update-quiz-answer.handler';
import { FindQuizParticipantHandler } from '../application/query/find-quiz-participant/find-quiz-participant.handler';
import { AddQuizQuestionHandler } from '../application/command/add-quiz-question/add-quiz-question.handler';
import { UpdateQuizQuestionHandler } from '../application/command/update-quiz-question/update-quiz-question.handler';
import { DeleteQuizQuestionHandler } from '../application/command/delete-quiz-question/delete-quiz-question.handler';
import { FindQuizSummaryHandler } from '../application/query/find-quiz-summary/find-quiz-summary.handler';
import { FindQuizParticipantsSummaryDetailHandler } from '../application/query/find-quiz-participants-summary-detail/find-quiz-participants-summary-detail.handler';
import { ProcessQuizParticipantResultHandler } from '../application/command/process-quiz-participant-result/process-quiz-participant-result.handler';
import { QuizParticipantProcessor } from '../driving-apdater/queue-processor/quiz-participant.processor';
import {
  QuizParticipantFinishedEventHandler,
  QuizParticipantStartedEventHandler,
} from '../application/event-handler/quiz-participant.event-handler';

export const quizProvider = [
  {
    provide: QUIZ_REPOSITORY_TOKEN,
    useClass: QuizRepository,
  },
  {
    provide: QUIZ_PARTICIPANT_REPOSITORY_TOKEN,
    useClass: QuizParticipantRepository,
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
  {
    provide: QUIZ_BINDING_TOKEN,
    useClass: QuizBinding,
  },
  /** Query */
  FindQuizzesHandler,
  FindQuizHandler,
  FindQuizParticipantHandler,
  FindQuizSummaryHandler,
  FindQuizParticipantsSummaryDetailHandler,
  /** Command */
  CreateQuizHandler,
  GenerateQuizHandler,
  UpdateQuizHandler,
  ProcessGenerationQuizHandler,
  DeleteQuizHandler,
  StartQuizHandler,
  UpdateQuizAnswerHandler,
  AddQuizQuestionHandler,
  UpdateQuizQuestionHandler,
  DeleteQuizQuestionHandler,
  ProcessQuizParticipantResultHandler,
  /** Event Handler */
  QuizCreatedEventHandler,
  QuizRegenerateEventHandler,
  QuizGeneratedEventHandler,
  QuizParticipantStartedEventHandler,
  QuizParticipantFinishedEventHandler,
  /** Processor */
  QuizParticipantProcessor,
];
