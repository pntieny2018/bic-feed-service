import { PostAllow } from '../../../data-type/post-allow.enum';
import { ContentEntity } from '../../model/content/content.entity';

export interface ICommentValidator {
  allowAction(post: ContentEntity, action: PostAllow): void;
}

export const COMMENT_VALIDATOR_TOKEN = 'COMMENT_VALIDATOR_TOKEN';
