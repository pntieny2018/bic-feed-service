import { CommentEntity } from '../model/Comment';

export interface ICommentRepository {
  createComment(data: CommentEntity): Promise<void>;
}

export const COMMENT_REPOSITORY_TOKEN = 'COMMENT_REPOSITORY_TOKEN';
