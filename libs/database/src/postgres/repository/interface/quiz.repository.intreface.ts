import { CursorPaginationProps, CursorPaginationResult } from '@app/database/postgres/common';
import { QuizAttributes, QuizModel } from '@app/database/postgres/model/quiz.model';
import { CONTENT_TYPE, QUIZ_STATUS } from '@beincom/constants';

export type FindOneQuizProps = {
  where: {
    id?: string;
    status?: QUIZ_STATUS;
  };
  attributes?: (keyof QuizAttributes)[];
};

export type FindAllQuizProps = {
  where: {
    ids?: string[];
    status?: QUIZ_STATUS;
    contentId?: string;
    contentIds?: string[];
    createdBy?: string;
  };
  attributes?: (keyof QuizAttributes)[];
};

export type GetPaginationQuizzesProps = {
  where: {
    status: QUIZ_STATUS;
    createdBy?: string;
  };
  contentType?: CONTENT_TYPE;
  attributes?: (keyof QuizAttributes)[];
} & CursorPaginationProps;

export interface ILibQuizRepository {
  findOne(input: FindOneQuizProps): Promise<QuizModel>;

  findAll(input: FindAllQuizProps): Promise<QuizModel[]>;

  update(quizId: string, data: Partial<QuizAttributes>): Promise<void>;

  create(data: QuizAttributes): Promise<void>;

  delete(id: string): Promise<void>;
  getPagination(
    getPaginationQuizzesProps: GetPaginationQuizzesProps
  ): Promise<CursorPaginationResult<QuizModel>>;
}

export const LIB_QUIZ_REPOSITORY_TOKEN = 'LIB_QUIZ_REPOSITORY_TOKEN';
