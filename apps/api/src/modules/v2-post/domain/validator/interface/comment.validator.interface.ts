import { UserDto } from '@libs/service/user';

import { CommentEntity } from '../../model/comment';

export type UpdateCommentProps = {
  id: string;
  actor: UserDto;
  content?: string;
  media?: {
    files: string[];
    images: string[];
    videos: string[];
  };
  mentions?: string[];
  giphyId?: string;
};

export interface ICommentValidator {
  getUpdateMasks(props: UpdateCommentProps, comment: CommentEntity): string[];
  validateNotHiddenComment(comment: CommentEntity): Promise<void>;
}

export const COMMENT_VALIDATOR_TOKEN = 'COMMENT_VALIDATOR_TOKEN';
