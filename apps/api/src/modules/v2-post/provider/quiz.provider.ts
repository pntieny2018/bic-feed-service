import { QuizBinding } from '../application/binding/binding-quiz/quiz.binding';
import { QUIZ_BINDING_TOKEN } from '../application/binding/binding-quiz/quiz.interface';
import {
  AddQuizQuestionHandler,
  CreateQuizHandler,
  DeleteQuizHandler,
  DeleteQuizQuestionHandler,
  GenerateQuizHandler,
  ProcessQuizParticipantResultHandler,
  StartQuizHandler,
  UpdateQuizAnswerHandler,
  UpdateQuizHandler,
  UpdateQuizQuestionHandler,
  ProcessGenerationQuizHandler,
} from '../application/command/quiz';
import {
  QuizCreatedEventHandler,
  QuizGeneratedEventHandler,
  QuizParticipantFinishedEventHandler,
  QuizParticipantStartedEventHandler,
  QuizRegenerateEventHandler,
} from '../application/event-handler/quiz';
import {
  FindQuizHandler,
  FindQuizParticipantHandler,
  FindQuizParticipantsSummaryDetailHandler,
  FindQuizSummaryHandler,
  FindQuizzesHandler,
} from '../application/query/quiz';
import { QUIZ_DOMAIN_SERVICE_TOKEN } from '../domain/domain-service/interface';
import { QuizDomainService } from '../domain/domain-service/quiz.domain-service';
import {
  QUIZ_REPOSITORY_TOKEN,
  QUIZ_PARTICIPANT_REPOSITORY_TOKEN,
} from '../domain/repositoty-interface';
import { QUIZ_VALIDATOR_TOKEN } from '../domain/validator/interface';
import { QuizValidator } from '../domain/validator/quiz.validator';
import { QuizParticipantRepository, QuizRepository } from '../driven-adapter/repository';
import { QuizParticipantProcessor } from '../driving-apdater/queue-processor/quiz-participant.processor';

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
    provide: QUIZ_DOMAIN_SERVICE_TOKEN,
    useClass: QuizDomainService,
  },
  {
    provide: QUIZ_VALIDATOR_TOKEN,
    useClass: QuizValidator,
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
