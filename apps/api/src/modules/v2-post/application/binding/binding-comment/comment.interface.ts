import { UserDto } from '../../../../v2-user/application';
import { CommentEntity } from '../../../domain/model/comment';
import { CommentBaseDto, CommentExtendedDto } from '../../dto';

export interface ICommentBinding {
  commentsBinding(
    commentEntities: CommentEntity[],
    authUser?: UserDto
  ): Promise<CommentExtendedDto[]>;
  commentBinding(
    commentEntity: CommentEntity,
    dataBinding?: {
      actor?: UserDto;
    }
  ): Promise<CommentBaseDto>;
}
export const COMMENT_BINDING_TOKEN = 'COMMENT_BINDING_TOKEN';
