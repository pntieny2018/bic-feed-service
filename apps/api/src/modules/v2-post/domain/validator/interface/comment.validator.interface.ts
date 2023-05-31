import { UpdateCommentCommandPayload } from '../../../application/command/update-comment/update-comment.command';
import { CommentEntity } from '../../model/comment/comment.entity';

export interface ICommentValidator {
  getUpdateMasks(payload: UpdateCommentCommandPayload, comment: CommentEntity): string[];
}

export const COMMENT_VALIDATOR_TOKEN = 'COMMENT_VALIDATOR_TOKEN';
