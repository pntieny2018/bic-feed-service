import { CursorPaginationProps } from '../../../../common/types/cursor-pagination-props.type';
import { CursorPaginationResult } from '../../../../common/types/cursor-pagination-result.type';
import { QuizEntity } from '../model/quiz';

export type QueryQuizOptions = CursorPaginationProps & {
  authUserId: string;
};

export interface IQuizQuery {
  getDraft(input: QueryQuizOptions): Promise<CursorPaginationResult<QuizEntity>>;
}

export const QUIZ_QUERY_TOKEN = 'QUIZ_QUERY_TOKEN';
