import { WhereOptions } from 'sequelize/types';
import { CommentEntity } from '../model/comment';
import { IComment } from '../../../../database/models/comment.model';

export interface ICommentRepository {
  createComment(data: CommentEntity): Promise<CommentEntity>;

  updateComment(id: string, data: Partial<IComment>): Promise<boolean>;

  destroyComment(id: string): Promise<boolean>;

  findOne(options: WhereOptions<IComment>): Promise<CommentEntity>;
}

export const COMMENT_REPOSITORY_TOKEN = 'COMMENT_REPOSITORY_TOKEN';
