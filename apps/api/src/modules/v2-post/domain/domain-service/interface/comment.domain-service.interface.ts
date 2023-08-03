import { GroupDto } from '../../../../v2-group/application';
import { CreateCommentProps } from '../../factory/interface';
import { CommentEntity } from '../../model/comment';
import { UserDto } from '../../../../v2-user/application';

export type UpdateCommentDto = {
  id: string;
  content?: string;
  media?: {
    files: string[];
    images: string[];
    videos: string[];
  };
  mentions?: string[];
  giphyId?: string;
};

export type UpdateCommentProps = {
  commentEntity: CommentEntity;
  groups: GroupDto[];
  mentionUsers: UserDto[];
  newData: UpdateCommentDto;
  actor: UserDto;
};

export interface ICommentDomainService {
  create(data: CreateCommentProps): Promise<CommentEntity>;

  update(input: UpdateCommentProps): Promise<void>;
}
export const COMMENT_DOMAIN_SERVICE_TOKEN = 'COMMENT_DOMAIN_SERVICE_TOKEN';
