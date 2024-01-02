import { CommentEntity } from '../../../domain/model/comment';
import { CommentBaseDto, CommentExtendedDto } from '../../dto';

export interface ICommentBinding {
  commentsBinding(commentEntities: CommentEntity[]): Promise<CommentExtendedDto[]>;
  commentBinding(commentEntity: CommentEntity): Promise<CommentBaseDto>;
}
export const COMMENT_BINDING_TOKEN = 'COMMENT_BINDING_TOKEN';
