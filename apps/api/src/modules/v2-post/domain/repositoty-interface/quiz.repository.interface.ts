import { CursorPaginationProps } from '../../../../common/types/cursor-pagination-props.type';
import { CursorPaginationResult } from '../../../../common/types/cursor-pagination-result.type';
import { PostStatus, PostType, QuizStatus } from '../../data-type';
import { QuizEntity, QuizProps } from '../model/quiz';

export type FindOneQuizProps = {
  where: {
    id?: string;
    status?: QuizStatus;
  };
  include?: {
    includeContent?: {
      type?: PostType;
      status: PostStatus;
      isHidden: boolean;
    };
  };
  attributes?: (keyof QuizProps)[];
};

export type FindAllQuizProps = {
  where: {
    ids?: string[];
    status?: QuizStatus;
    contentId?: string;
    contentIds?: string[];
    createdBy?: string;
  };
  include?: {
    includeContent?: {
      type?: PostType;
      status: PostStatus;
      isHidden: boolean;
    };
  };
  attributes?: (keyof QuizProps)[];
};

export type GetPaginationQuizzesProps = FindAllQuizProps & CursorPaginationProps;

export interface IQuizRepository {
  findOne(input: FindOneQuizProps): Promise<QuizEntity>;

  findAll(input: FindAllQuizProps): Promise<QuizEntity[]>;

  update(data: QuizEntity): Promise<void>;

  create(data: QuizEntity): Promise<void>;

  delete(id: string): Promise<void>;

  getPagination(
    getPaginationQuizzesProps: GetPaginationQuizzesProps
  ): Promise<CursorPaginationResult<QuizEntity>>;
}

export const QUIZ_REPOSITORY_TOKEN = 'QUIZ_REPOSITORY_TOKEN';
