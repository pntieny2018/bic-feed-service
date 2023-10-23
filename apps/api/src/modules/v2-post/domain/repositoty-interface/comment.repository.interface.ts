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
  contentId: string;
  parentId?: string;
};

export type GetAroundCommentProps = {
  authUserId?: string;
  limit: number;
  order: ORDER;
};

export type GetAroundCommentResult = CursorPaginationResult<CommentEntity> & {
  targetIndex: number;
};

export interface ICommentRepository {
  getPagination(input: GetPaginationCommentProps): Promise<CursorPaginationResult<CommentEntity>>;

  getAroundComment(
    commentId: string,
    props: GetAroundCommentProps
  ): Promise<GetAroundCommentResult>;

  createComment(data: CommentEntity): Promise<CommentEntity>;

  update(input: CommentEntity): Promise<void>;

  /**
   * Temporarily set return type, will refactor soon
   */
  destroyComment(id: string): Promise<void>;

  findOne(where: WhereOptions<CommentAttributes>, options?: FindOneProps): Promise<CommentEntity>;

  findPrevComments(commentId: string, contentId: string): Promise<CommentEntity[]>;

  getValidUsersFollow(userIds: string[], groupIds: string[]): Promise<string[]>;

  getParentComment(commentId: string, commentParentId: string): Promise<CommentEntity>;
}

export const COMMENT_REPOSITORY_TOKEN = 'COMMENT_REPOSITORY_TOKEN';
