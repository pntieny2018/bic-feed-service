import { WhereOptions } from 'sequelize/types';
import { CommentEntity } from '../model/comment';
import { IComment } from '../../../../database/models/comment.model';

export type FindOneOptions = {
  excludeReportedByUserId?: string;
  includeOwnerReactions?: string;
};

export interface ICommentRepository {
  createComment(data: CommentEntity): Promise<CommentEntity>;

  update(input: CommentEntity): Promise<void>;

  /**
   * Temporarily set return type, will refactor soon
   */
  destroyComment(id: string): Promise<void>;

  findOne(where: WhereOptions<IComment>, options?: FindOneOptions): Promise<CommentEntity>;
}

export const COMMENT_REPOSITORY_TOKEN = 'COMMENT_REPOSITORY_TOKEN';
