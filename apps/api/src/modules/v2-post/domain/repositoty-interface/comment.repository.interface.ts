import { ORDER } from '@beincom/constants';
import { CursorPaginationProps } from '@libs/database/postgres/common';
import { WhereOptions } from 'sequelize/types';

import { CursorPaginationResult } from '../../../../common/types';
import { IComment } from '../../../../database/models/comment.model';
import { CommentEntity } from '../model/comment';

export type FindOneProps = {
  excludeReportedByUserId?: string;
  includeOwnerReactions?: string;
};

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

  findOne(where: WhereOptions<IComment>, options?: FindOneProps): Promise<CommentEntity>;
}

export const COMMENT_REPOSITORY_TOKEN = 'COMMENT_REPOSITORY_TOKEN';
