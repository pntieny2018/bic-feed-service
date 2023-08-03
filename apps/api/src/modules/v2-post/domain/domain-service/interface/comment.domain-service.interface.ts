import { GroupDto } from '../../../../v2-group/application';
import { CreateCommentProps } from '../../factory/interface';
import { CommentEntity } from '../../model/comment';
import { UserDto } from '../../../../v2-user/application';
import { UpdateCommentDto } from '../../model/comment/type/comment.dto';

export type UpdateCommentProps = {
  commentEntity: CommentEntity;
  groups: GroupDto[];
  mentionUsers: UserDto[];
  newData: UpdateCommentDto;
};

export interface ICommentDomainService {
  create(data: CreateCommentProps): Promise<CommentEntity>;

  update(input: UpdateCommentProps): Promise<void>;
}
export const COMMENT_DOMAIN_SERVICE_TOKEN = 'COMMENT_DOMAIN_SERVICE_TOKEN';
