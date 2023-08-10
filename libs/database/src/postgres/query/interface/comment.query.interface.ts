import { CursorPaginationProps, CursorPaginationResult } from '@app/database/postgres/common';
import { IUser } from '@app/service/user/src/interfaces';
import { ORDER } from '@beincom/constants';

import { CommentAttributes, CommentModel } from '../../model/comment.model';

export type GetPaginationCommentProps = CursorPaginationProps & {
  authUser?: IUser;
  postId: string;
  parentId?: string;
};

export type GetAroundCommentProps = {
  authUser?: IUser;
  limit: number;
  order: ORDER;
};

export interface ILibCommentQuery {
  getPagination(input: GetPaginationCommentProps): Promise<CursorPaginationResult<CommentModel>>;

  getAroundComment(
    comment: CommentAttributes,
    props: GetAroundCommentProps
  ): Promise<CursorPaginationResult<CommentModel>>;

  findComment(id: string, authUser: IUser): Promise<CommentModel>;
}

export const LIB_COMMENT_QUERY_TOKEN = 'LIB_COMMENT_QUERY_TOKEN';
