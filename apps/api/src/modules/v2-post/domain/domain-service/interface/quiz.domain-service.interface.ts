import { QuizEntity } from '../../model/quiz';
import { OrderEnum } from '../../../../../common/dto';
import { UserDto } from '../../../../v2-user/application';
import { QuestionDto } from '../../../application/dto/question.dto';
import { QuizStatus } from '../../../data-type/quiz-status.enum';
import { CursorPaginationResult } from '../../../../../common/types/cursor-pagination-result.type';
import { PostType } from '../../../data-type';

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
  quizId: string;
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
  authUser: UserDto;
};

export type GetQuizDraftsProps = {
  authUser: UserDto;
  type?: PostType;
  limit: number;
  order: OrderEnum;
  before?: string;
  after?: string;
};

export interface IQuizDomainService {
  create(data: QuizCreateProps): Promise<QuizEntity>;
  update(data: QuizUpdateProps): Promise<QuizEntity>;
  getQuiz(quizId: string, authUser: UserDto): Promise<QuizEntity>;
  delete(quizId: string, authUser: UserDto): Promise<void>;
  reGenerate(quizId: string, authUser: UserDto): Promise<QuizEntity>;
  generateQuestions(quizEntity: QuizEntity): Promise<void>;
  getDrafts(data: GetQuizDraftsProps): Promise<CursorPaginationResult<QuizEntity>>;
}
export const QUIZ_DOMAIN_SERVICE_TOKEN = 'QUIZ_DOMAIN_SERVICE_TOKEN';
