import { CursorPaginationProps } from '../../../../common/types/cursor-pagination-props.type';
import { CursorPaginationResult } from '../../../../common/types/cursor-pagination-result.type';
import { IQuiz } from '../../../../database/models/quiz.model';
import { PostType, QuizStatus } from '../../data-type';
import { QuizEntity, QuizQuestionEntity } from '../model/quiz';

export type FindOneQuizProps = {
  where: {
    id?: string;
    status?: QuizStatus;
  };
  attributes?: (keyof IQuiz)[];
};

export type FindAllQuizProps = {
  where: {
    ids?: string[];
    status?: QuizStatus;
    contentId?: string;
    contentIds?: string[];
    createdBy?: string;
  };
  attributes?: (keyof IQuiz)[];
};

export type GetPaginationQuizzesProps = {
  where: {
    status: QuizStatus;
    createdBy?: string;
  };
  contentType?: PostType;
  attributes?: (keyof IQuiz)[];
} & CursorPaginationProps;

export interface IQuizRepository {
  createQuiz(quizEntity: QuizEntity): Promise<void>;
  updateQuiz(quizEntity: QuizEntity): Promise<void>;
  updateQuizWithUpdateQuestions(quizEntity: QuizEntity): Promise<void>;
  deleteQuiz(quizId: string): Promise<void>;

  findQuizById(quizId: string): Promise<QuizEntity>;
  findQuizByIdWithQuestions(quizId: string): Promise<QuizEntity>;
  findAllQuizzes(input: FindAllQuizProps): Promise<QuizEntity[]>;
  getPagination(
    getPaginationQuizzesProps: GetPaginationQuizzesProps
  ): Promise<CursorPaginationResult<QuizEntity>>;

  genQuestions(quizEntity: QuizEntity, rawContent: string): Promise<void>;
  addQuestion(questionEntity: QuizQuestionEntity): Promise<void>;
  deleteQuestion(questionId: string): Promise<void>;
  updateQuestion(questionEntity: QuizQuestionEntity): Promise<void>;
  findQuestionById(questionId: string): Promise<QuizQuestionEntity>;
}

export const QUIZ_REPOSITORY_TOKEN = 'QUIZ_REPOSITORY_TOKEN';
