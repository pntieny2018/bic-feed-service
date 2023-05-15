import { WhereOptions } from 'sequelize/types';
import { CommentEntity } from '../model/Comment';
import { IComment } from '../../../../database/models/comment.model';

export interface ICommentRepository {
  createComment(data: CommentEntity): Promise<CommentEntity>;

  findOne(options: WhereOptions<IComment>): Promise<CommentEntity>;
}

export const COMMENT_REPOSITORY_TOKEN = 'COMMENT_REPOSITORY_TOKEN';
