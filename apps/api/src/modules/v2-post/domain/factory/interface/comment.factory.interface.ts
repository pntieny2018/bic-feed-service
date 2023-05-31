import { UserDto } from '../../../../v2-user/application';
import { GroupDto } from '../../../../v2-group/application';
import { CommentEntity, CommentProps } from '../../model/comment';

export type CreateCommentProps = {
  data: BasedCommentAttribute;
  groups: GroupDto[];
  mentionUsers: UserDto[];
};

export type BasedCommentAttribute = {
  userId: string;
  postId: string;
  parentId?: string;
  content?: string;
  giphyId?: string;
  media?: {
    files: string[];
    images: string[];
    videos: string[];
  };
  mentions?: string[];
};

export interface ICommentFactory {
  createComment(props: BasedCommentAttribute): CommentEntity;

  reconstitute(props: CommentProps): CommentEntity;
}

export const COMMENT_FACTORY_TOKEN = 'COMMENT_FACTORY_TOKEN';
