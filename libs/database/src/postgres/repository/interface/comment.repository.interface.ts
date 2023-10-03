import { ORDER } from '@beincom/constants';
import { CursorPaginationProps, CursorPaginationResult } from '@libs/database/postgres/common';
import { CommentAttributes, CommentModel } from '@libs/database/postgres/model';
import { UserDto } from '@libs/service/user';
import { WhereOptions } from 'sequelize/types';

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

export interface ILibCommentRepository {
  getPagination(input: GetPaginationCommentProps): Promise<CursorPaginationResult<CommentModel>>;

  getAroundComment(id: string, props: GetAroundCommentProps): Promise<GetAroundCommentResult>;

  findComment(id: string, authUser: UserDto): Promise<CommentModel>;

  createComment(data: CommentAttributes): Promise<CommentModel>;

  update(commentId: string, data: Partial<CommentAttributes>): Promise<void>;

  destroyComment(id: string): Promise<void>;

  findOne(where: WhereOptions<CommentAttributes>, options?: FindOneOptions): Promise<CommentModel>;
}

export const LIB_COMMENT_REPOSITORY_TOKEN = 'LIB_COMMENT_REPOSITORY_TOKEN';
