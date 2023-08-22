import { ORDER } from '@beincom/constants';
import { CursorPaginationProps, CursorPaginationResult } from '@libs/database/postgres/common';
import { UserDto } from '@libs/service/user';

import { CommentAttributes, CommentModel } from '../../model/comment.model';

export type GetPaginationCommentProps = CursorPaginationProps & {
  authUser?: UserDto;
  postId: string;
  parentId?: string;
};

export type GetAroundCommentProps = {
  authUser?: UserDto;
  limit: number;
  order: ORDER;
};

export interface ILibCommentQuery {
  getPagination(input: GetPaginationCommentProps): Promise<CursorPaginationResult<CommentModel>>;

  getAroundComment(
    comment: CommentAttributes,
    props: GetAroundCommentProps
  ): Promise<CursorPaginationResult<CommentModel>>;

  findComment(id: string, authUser: UserDto): Promise<CommentModel>;
}

export const LIB_COMMENT_QUERY_TOKEN = 'LIB_COMMENT_QUERY_TOKEN';
