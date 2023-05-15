import { ForbiddenException, Injectable } from '@nestjs/common';
import { HTTP_STATUS_ID } from '../../../../common/constants';
import { PostAllow } from '../../data-type/post-allow.enum';
import { ICommentValidator } from './interface/comment.validator.interface';
import { ContentEntity } from '../model/content/content.entity';

@Injectable()
export class CommentValidator implements ICommentValidator {
  /**
   * Check post policy
   * @param post PostEntity
   * @param action PostAllow
   * @returns Promise resolve boolean
   */
  public allowAction(post: ContentEntity, action: PostAllow): void {
    if (!post.get('setting')[action]) {
      throw new ForbiddenException({
        code: HTTP_STATUS_ID.API_FORBIDDEN,
        message:
          action === PostAllow.REACT
            ? `React of this post are not available`
            : `Comment of this post are not available`,
      });
    }
  }
}
