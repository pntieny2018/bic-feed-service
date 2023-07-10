import { QuizEntity } from '../../model/quiz';
import { UserDto } from '../../../../v2-user/application';
import { QuestionDto } from '../../../application/dto/question.dto';
import { QuizStatus } from '../../../data-type/quiz-status.enum';

export type QuizCreateProps = {
  contentId: string;
  numberOfQuestions: number;
  numberOfAnswers: number;
  authUser: UserDto;
  questions?: {
    question: string;
    answers: {
      answer: string;
      isCorrect: boolean;
    }[];
  }[];
  title?: string;
  description?: string;
  numberOfQuestionsDisplay?: number;
  numberOfAnswersDisplay?: number;
  isRandom?: boolean;
  meta?: any;
};

export type QuizUpdateProps = {
  numberOfQuestions?: number;
  numberOfAnswers?: number;
  questions?: QuestionDto[];
  title?: string;
  description?: string;
  numberOfQuestionsDisplay?: number;
  numberOfAnswersDisplay?: number;
  isRandom?: boolean;
  meta?: any;
  status?: QuizStatus;
};

export interface IQuizDomainService {
  create(data: QuizCreateProps): Promise<QuizEntity>;
  update(quizEntity: QuizEntity, data: QuizUpdateProps): Promise<QuizEntity>;
  reGenerate(quizEntity: QuizEntity): Promise<void>;
  generateQuestions(quizEntity: QuizEntity): Promise<QuizEntity>;
}
export const QUIZ_DOMAIN_SERVICE_TOKEN = 'QUIZ_DOMAIN_SERVICE_TOKEN';
