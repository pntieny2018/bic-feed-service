import { CONTENT_TYPE, ORDER, QUIZ_STATUS } from '@beincom/constants';
import { CursorPaginationResult } from '@libs/database/postgres/common';
import { UserDto } from '@libs/service/user';

import { AnswerUserDto } from '../../../application/dto';
import { QuizEntity, QuizQuestionEntity } from '../../model/quiz';
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
  isRandom?: boolean;
  meta?: any;
};

export type QuizUpdateProps = {
  quizId: string;
  numberOfQuestions?: number;
  numberOfAnswers?: number;
  title?: string;
  description?: string;
  numberOfQuestionsDisplay?: number;
  isRandom?: boolean;
  meta?: any;
  status?: QUIZ_STATUS;
  authUser: UserDto;
};

export type GetQuizzesProps = {
  authUser: UserDto;
  status: QUIZ_STATUS;
  type?: CONTENT_TYPE;
  limit: number;
  order: ORDER;
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

export type UpdateQuestionProps = AddQuestionProps & {
  questionId: string;
};

export interface IQuizDomainService {
  create(data: QuizCreateProps): Promise<QuizEntity>;
  update(data: QuizUpdateProps): Promise<QuizEntity>;
  getQuiz(quizId: string, authUser: UserDto): Promise<QuizEntity>;
  delete(quizId: string, authUser: UserDto): Promise<void>;
  startQuiz(quizEntity: QuizEntity, authUser: UserDto): Promise<QuizParticipantEntity>;
  updateQuizAnswers(
    quizParticipantEntity: QuizParticipantEntity,
    answers: AnswerUserDto[],
    isFinished: boolean
  ): Promise<void>;
  reGenerate(quizId: string, authUser: UserDto): Promise<QuizEntity>;
  generateQuestions(id: string): Promise<void>;
  getQuizzes(data: GetQuizzesProps): Promise<CursorPaginationResult<QuizEntity>>;
  getQuizParticipant(quizParticipantId: string, authUserId: string): Promise<QuizParticipantEntity>;
  updateQuestion(updateQuestionProps: UpdateQuestionProps): Promise<QuizQuestionEntity>;
  addQuestion(addQuestionProps: AddQuestionProps): Promise<QuizQuestionEntity>;
  deleteQuestion(questionId: string, quizId: string, authUser: UserDto): Promise<void>;
  calculateHighestScore(quizParticipantEntity: QuizParticipantEntity): Promise<void>;
}
export const QUIZ_DOMAIN_SERVICE_TOKEN = 'QUIZ_DOMAIN_SERVICE_TOKEN';
