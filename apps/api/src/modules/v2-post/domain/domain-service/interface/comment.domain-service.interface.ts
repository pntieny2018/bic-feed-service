import { GroupDto } from '../../../../v2-group/application/group.dto';
import { UpdateCommentCommandPayload } from '../../../application/command/update-comment/update-comment.command';
import { CreateCommentProps } from '../../factory/interface/comment.factory.interface';
import { CommentEntity } from '../../model/comment';
import { UserDto } from '../../../../v2-user/application/user.dto';

export type UpdateCommentProps = {
  commentEntity: CommentEntity;
  groups: GroupDto[];
  mentionUsers: UserDto[];
  newData: UpdateCommentCommandPayload;
};

export interface ICommentDomainService {
  create(data: CreateCommentProps): Promise<CommentEntity>;

  update(input: UpdateCommentProps): Promise<void>;
}
export const COMMENT_DOMAIN_SERVICE_TOKEN = 'COMMENT_DOMAIN_SERVICE_TOKEN';
