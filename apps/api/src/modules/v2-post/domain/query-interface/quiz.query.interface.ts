import { CursorPaginationProps } from '../../../../common/types/cursor-pagination-props.type';
import { CursorPaginationResult } from '../../../../common/types/cursor-pagination-result.type';
import { PostStatus, QuizStatus } from '../../data-type';
import { ArticleEntity, PostEntity, SeriesEntity } from '../model/content';

export type QueryQuizOptions = {
  where: {
    createdBy?: string;
    status: QuizStatus;
  };
  include?: {
    includePost?: {
      required: boolean;
      isHidden?: boolean;
      createdBy?: string;
      status: PostStatus;
    };
    includeGroup?: {
      groupArchived?: boolean;
      required: boolean;
    };
  };
} & CursorPaginationProps;

export interface IQuizQuery {
  getDraft(
    input: QueryQuizOptions
  ): Promise<CursorPaginationResult<ArticleEntity | PostEntity | SeriesEntity>>;
}

export const QUIZ_QUERY_TOKEN = 'QUIZ_QUERY_TOKEN';
