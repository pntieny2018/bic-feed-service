import { OrderEnum } from '../../../../common/dto';
import { CursorPaginationProps } from '../../../../common/types/cursor-pagination-props.type';
import { CursorPaginationResult } from '../../../../common/types/cursor-pagination-result.type';
import { CommentEntity } from '../model/comment';

export type GetPaginationCommentProps = CursorPaginationProps & {
  authUser?: string;
  postId: string;
  parentId?: string;
};

export type GetArroundCommentProps = {
  authUser?: string;
  limit: number;
  order: OrderEnum;
};

export interface ICommentQuery {
  getPagination(input: GetPaginationCommentProps): Promise<CursorPaginationResult<CommentEntity>>;

  getArroundComment(
    comment: CommentEntity,
    props: GetArroundCommentProps
  ): Promise<CursorPaginationResult<CommentEntity>>;
}

export const COMMENT_QUERY_TOKEN = 'COMMENT_QUERY_TOKEN';
