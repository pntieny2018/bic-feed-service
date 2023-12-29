import { UserDto } from '../../../../v2-user/application';
import { CommentEntity } from '../../../domain/model/comment';
import { CommentBaseDto, CommentExtendedDto } from '../../dto';

export interface ICommentBinding {
  commentsBinding(
    commentEntities: CommentEntity[],
    dataBinding: { authUser: UserDto }
  ): Promise<CommentExtendedDto[]>;
  commentBinding(
    commentEntity: CommentEntity,
    dataBinding: { authUser: UserDto }
  ): Promise<CommentBaseDto>;
}
export const COMMENT_BINDING_TOKEN = 'COMMENT_BINDING_TOKEN';
