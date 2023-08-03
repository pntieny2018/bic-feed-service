import { CommentEntity } from '../../model/comment';
import { UserDto } from '../../../../v2-user/application';

export type UpdateCommentDto = {
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
  getUpdateMasks(payload: UpdateCommentDto, comment: CommentEntity): string[];
}

export const COMMENT_VALIDATOR_TOKEN = 'COMMENT_VALIDATOR_TOKEN';
