import { UserDto } from '../../../../v2-user/application';
import { CommentDto } from '../../dto';
import { CommentEntity } from '../../../domain/model/comment';
import { CommentResponseDto } from '../../../driving-apdater/dto/response';

export interface ICommentBinding {
  commentsBinding(commentEntities: CommentEntity[]): Promise<CommentResponseDto[]>;
  commentBinding(
    commentEntity: CommentEntity,
    dataBinding?: {
      actor?: UserDto;
    }
  ): Promise<CommentDto>;
}
export const COMMENT_BINDING_TOKEN = 'COMMENT_BINDING_TOKEN';
