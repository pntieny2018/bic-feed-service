import { CursorPaginationProps } from '../../../../common/types/cursor-pagination-props.type';
import { CursorPaginationResult } from '../../../../common/types/cursor-pagination-result.type';
import { IQuiz } from '../../../../database/models/quiz.model';
import { QuizEntity, QuizQuestionEntity } from '../model/quiz';
import { CONTENT_TYPE, QUIZ_STATUS } from '@beincom/constants';

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
  deleteQuiz(quizId: string): Promise<void>;

  findQuizById(quizId: string): Promise<QuizEntity>;
  findQuizByIdWithQuestions(quizId: string): Promise<QuizEntity>;
  findAllQuizzes(input: FindAllQuizProps): Promise<QuizEntity[]>;
  getPagination(
    getPaginationQuizzesProps: GetPaginationQuizzesProps
  ): Promise<CursorPaginationResult<QuizEntity>>;

  addQuestion(questionEntity: QuizQuestionEntity): Promise<void>;
  deleteQuestion(questionId: string): Promise<void>;
  updateQuestion(questionEntity: QuizQuestionEntity): Promise<void>;
  findQuestionById(questionId: string): Promise<QuizQuestionEntity>;
}

export const QUIZ_REPOSITORY_TOKEN = 'QUIZ_REPOSITORY_TOKEN';
