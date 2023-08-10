import { CommentAttributes, CommentModel } from '@app/database/postgres/model/comment.model';
import { WhereOptions } from 'sequelize/types';

export type FindOneOptions = {
  excludeReportedByUserId?: string;
  includeOwnerReactions?: string;
};

export interface ILibCommentRepository {
  createComment(data: CommentAttributes): Promise<CommentModel>;
  update(commentId: string, data: Partial<CommentAttributes>): Promise<void>;

  destroyComment(id: string): Promise<void>;

  findOne(where: WhereOptions<CommentAttributes>, options?: FindOneOptions): Promise<CommentModel>;
}

export const LIB_COMMENT_REPOSITORY_TOKEN = 'LIB_COMMENT_REPOSITORY_TOKEN';
