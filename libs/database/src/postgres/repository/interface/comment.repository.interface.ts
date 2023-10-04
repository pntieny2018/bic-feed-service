import { ORDER } from '@beincom/constants';
import { CursorPaginationProps, CursorPaginationResult } from '@libs/database/postgres/common';
import { CommentModel } from '@libs/database/postgres/model';

export type FindOneOptions = {
  excludeReportedByUserId?: string;
  includeOwnerReactions?: string;
};

export type GetPaginationCommentProps = CursorPaginationProps & {
  authUserId?: string;
  postId: string;
  parentId?: string;
};

export type GetAroundCommentProps = {
  authUserId?: string;
  limit: number;
  order: ORDER;
};

export type GetAroundCommentResult = CursorPaginationResult<CommentModel> & { targetIndex: number };
