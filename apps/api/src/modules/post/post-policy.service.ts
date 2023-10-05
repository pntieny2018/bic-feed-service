import { IPost } from '../../database/models/post.model';
import { Injectable, Logger } from '@nestjs/common';
import { PostAllow } from './post.constants';
import { PostResponseDto } from './dto/responses';
import { DomainForbiddenException } from '../../common/exceptions';

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
    if (
      (post instanceof PostResponseDto && !post.setting[action]) ||
      (!(post instanceof PostResponseDto) && !post[action])
    ) {
      throw new DomainForbiddenException(
        action === PostAllow.REACT
          ? `React of this post are not available`
          : `Comment of this post are not available`
      );
    }
  }
}
