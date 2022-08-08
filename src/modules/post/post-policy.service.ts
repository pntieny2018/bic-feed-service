import { IPost } from '../../database/models/post.model';
import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { PostAllow } from './post.constants';
import { LogicException } from '../../common/exceptions';
import { HTTP_STATUS_ID } from '../../common/constants';
import { PostResponseDto } from './dto/responses';

@Injectable()
export class PostPolicyService {
  /**
   * Logger
   * @private
   */
  private _logger = new Logger(PostPolicyService.name);

  /**
   * Check post policy
   * @param post IPost
   * @param action PostAllow
   * @returns Promise resolve boolean
   */
  public async allow(post: IPost | PostResponseDto, action: PostAllow): Promise<void> {
    if (post instanceof PostResponseDto && !post.setting[action]) {
      throw new ForbiddenException({
        code: HTTP_STATUS_ID.API_FORBIDDEN,
        message:
          action === PostAllow.REACT
            ? `React of this post are not available`
            : `Comment of this post are not available`,
      });
    } else if (!(post instanceof PostResponseDto) && !post[action]) {
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
