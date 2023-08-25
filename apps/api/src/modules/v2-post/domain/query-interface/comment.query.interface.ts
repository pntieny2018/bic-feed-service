import { ORDER } from '@beincom/constants';

import { CursorPaginationProps } from '../../../../common/types/cursor-pagination-props.type';
import { CursorPaginationResult } from '../../../../common/types/cursor-pagination-result.type';
import { CommentEntity } from '../model/comment';

export type GetPaginationCommentProps = CursorPaginationProps & {
  authUser?: string;
  postId: string;
  parentId?: string;
};

export type GetAroundCommentProps = {
  authUser?: string;
  limit: number;
  order: ORDER;
};

export interface ICommentQuery {
  getPagination(input: GetPaginationCommentProps): Promise<CursorPaginationResult<CommentEntity>>;

  getAroundComment(
    comment: CommentEntity,
    props: GetAroundCommentProps
  ): Promise<CursorPaginationResult<CommentEntity>>;
}

export const COMMENT_QUERY_TOKEN = 'COMMENT_QUERY_TOKEN';
