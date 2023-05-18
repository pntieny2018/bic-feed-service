import { WhereOptions } from 'sequelize/types';
import { CommentEntity } from '../model/comment';
import { IComment } from '../../../../database/models/comment.model';

export interface ICommentRepository {
  createComment(data: CommentEntity): Promise<CommentEntity>;

  update(input: CommentEntity): Promise<void>;

  /**
   * Temporarily set return type, will refactor soon
   */
  destroyComment(id: string): Promise<IComment>;

  findOne(options: WhereOptions<IComment>): Promise<CommentEntity>;
}

export const COMMENT_REPOSITORY_TOKEN = 'COMMENT_REPOSITORY_TOKEN';
