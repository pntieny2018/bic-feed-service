import { QuizEntity, QuizQuestionEntity } from '../../model/quiz';
import { OrderEnum } from '../../../../../common/dto';
import { UserDto } from '../../../../v2-user/application';
import { QuestionDto } from '../../../application/dto/question.dto';
import { QuizStatus } from '../../../data-type/quiz-status.enum';
import { CursorPaginationResult } from '../../../../../common/types/cursor-pagination-result.type';
import { PostType } from '../../../data-type';
import { QuizParticipantEntity } from '../../model/quiz-participant';

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

export type GetQuizzesProps = {
  authUser: UserDto;
  status: QuizStatus;
  type?: PostType;
  limit: number;
  order: OrderEnum;
  before?: string;
  after?: string;
};

export type AddQuestionProps = {
  quizId: string;
  content: string;
  answers: {
    id?: string;
    content: string;
    isCorrect: boolean;
  }[];
  authUser: UserDto;
};

export type UpdateQuestionProps = {
  questionId: string;
  content: string;
  answers: {
    id?: string;
    content: string;
    isCorrect: boolean;
  }[];
  authUser: UserDto;
};
export interface IQuizDomainService {
  create(data: QuizCreateProps): Promise<QuizEntity>;
  update(data: QuizUpdateProps): Promise<QuizEntity>;
  getQuiz(quizId: string, authUser: UserDto): Promise<QuizEntity>;
  delete(quizId: string, authUser: UserDto): Promise<void>;
  startQuiz(quizEntity: QuizEntity, authUser: UserDto): Promise<QuizParticipantEntity>;
  reGenerate(quizId: string, authUser: UserDto): Promise<QuizEntity>;
  generateQuestions(quizEntity: QuizEntity): Promise<void>;
  getQuizzes(data: GetQuizzesProps): Promise<CursorPaginationResult<QuizEntity>>;
  getQuizParticipant(quizParticipantId: string, authUserId: string): Promise<QuizParticipantEntity>;
  updateQuestion(updateQuestionProps: UpdateQuestionProps): Promise<QuizQuestionEntity>;
  addQuestion(addQuestionProps: AddQuestionProps): Promise<QuizQuestionEntity>;
  deleteQuestion(questionId: string, authUser: UserDto): Promise<void>;
  calculateHighestScore(quizParticipantEntity: QuizParticipantEntity): Promise<void>;
  createQuizParticipantResultJob(quizParticipantId: string, delay?: number): Promise<void>;
}
export const QUIZ_DOMAIN_SERVICE_TOKEN = 'QUIZ_DOMAIN_SERVICE_TOKEN';
