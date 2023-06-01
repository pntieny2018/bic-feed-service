import { CommentEntity } from '../../../domain/model/comment';
import { CommentResponseDto } from '../../../driving-apdater/dto/response';

export interface ICommentBinding {
  commentBinding(commentEntity: CommentEntity[]): Promise<CommentResponseDto[]>;
}
export const COMMENT_BINDING_TOKEN = 'COMMENT_BINDING_TOKEN';
