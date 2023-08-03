import { CommentEntity } from '../../model/comment';
import { UpdateCommentDto } from '../../model/comment/type/comment.dto';

export interface ICommentValidator {
  getUpdateMasks(payload: UpdateCommentDto, comment: CommentEntity): string[];
}

export const COMMENT_VALIDATOR_TOKEN = 'COMMENT_VALIDATOR_TOKEN';
