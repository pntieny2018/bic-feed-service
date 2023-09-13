import { ORDER } from '@beincom/constants';
import { CursorPaginationProps, CursorPaginationResult } from '@libs/database/postgres/common';
import { CommentAttributes } from '@libs/database/postgres/model/comment.model';
import { WhereOptions } from 'sequelize/types';

import { CommentEntity } from '../model/comment';

export type FindOneProps = {
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

export interface ICommentRepository {
  getPagination(input: GetPaginationCommentProps): Promise<CursorPaginationResult<CommentEntity>>;

  getAroundComment(
    comment: CommentEntity,
    props: GetAroundCommentProps
  ): Promise<CursorPaginationResult<CommentEntity>>;

  createComment(data: CommentEntity): Promise<CommentEntity>;

  update(input: CommentEntity): Promise<void>;

  /**
   * Temporarily set return type, will refactor soon
   */
  destroyComment(id: string): Promise<void>;

  findOne(where: WhereOptions<CommentAttributes>, options?: FindOneProps): Promise<CommentEntity>;
}

export const COMMENT_REPOSITORY_TOKEN = 'COMMENT_REPOSITORY_TOKEN';
