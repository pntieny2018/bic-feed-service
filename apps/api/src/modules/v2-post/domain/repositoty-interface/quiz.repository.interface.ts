import { CONTENT_TYPE, QUIZ_STATUS } from '@beincom/constants';
import { CursorPaginationProps, CursorPaginationResult } from '@libs/database/postgres/common';

import { IQuiz } from '../../../../database/models/quiz.model';
import { QuizEntity, QuizQuestionEntity } from '../model/quiz';

export type FindOneQuizProps = {
  where: {
    id?: string;
    status?: QUIZ_STATUS;
  };
  attributes?: (keyof IQuiz)[];
};

export type FindAllQuizProps = {
  where: {
    ids?: string[];
    status?: QUIZ_STATUS;
    contentId?: string;
    contentIds?: string[];
    createdBy?: string;
  };
  attributes?: (keyof IQuiz)[];
};

export type GetPaginationQuizzesProps = {
  where: {
    status: QUIZ_STATUS;
    createdBy?: string;
    contentType?: CONTENT_TYPE;
  };
  attributes?: (keyof IQuiz)[];
} & CursorPaginationProps;

export interface IQuizRepository {
  createQuiz(quizEntity: QuizEntity): Promise<void>;
  updateQuiz(quizEntity: QuizEntity): Promise<void>;
  deleteQuiz(quizId: string, contentId: string): Promise<void>;

  findQuizById(quizId: string): Promise<QuizEntity>;
  findQuizByIdWithQuestions(quizId: string): Promise<QuizEntity>;
  findAllQuizzes(input: FindAllQuizProps): Promise<QuizEntity[]>;
  getPagination(
    getPaginationQuizzesProps: GetPaginationQuizzesProps
  ): Promise<CursorPaginationResult<QuizEntity>>;

  createQuestion(questionEntity: QuizQuestionEntity): Promise<void>;
  deleteQuestion(questionId: string): Promise<void>;
  updateQuestion(questionEntity: QuizQuestionEntity): Promise<void>;
  findQuestionById(questionId: string): Promise<QuizQuestionEntity>;

  createAnswers(questionEntity: QuizQuestionEntity): Promise<void>;
  deleteAnswersByQuestionId(questionId: string): Promise<void>;
}

export const QUIZ_REPOSITORY_TOKEN = 'QUIZ_REPOSITORY_TOKEN';
