import { IQuiz } from '../../../../database/models/quiz.model';
import { CursorPaginationProps } from '../../../../common/types/cursor-pagination-props.type';
import { CursorPaginationResult } from '../../../../common/types/cursor-pagination-result.type';
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
  findOne(id: string): Promise<QuizEntity>;
  findQuizWithQuestions(id: string): Promise<QuizEntity>;

  findAll(input: FindAllQuizProps): Promise<QuizEntity[]>;

  update(data: QuizEntity): Promise<void>;

  create(data: QuizEntity): Promise<void>;

  delete(id: string): Promise<void>;
  getPagination(
    getPaginationQuizzesProps: GetPaginationQuizzesProps
  ): Promise<CursorPaginationResult<QuizEntity>>;
  findQuizQuestion(questionId: string): Promise<QuizQuestionEntity>;
  addQuestion(question: QuizQuestionEntity): Promise<void>;
  deleteQuestion(questionId: string): Promise<void>;
  updateQuestion(question: QuizQuestionEntity): Promise<void>;
}

export const QUIZ_REPOSITORY_TOKEN = 'QUIZ_REPOSITORY_TOKEN';
