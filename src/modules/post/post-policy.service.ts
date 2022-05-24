import { IPost } from '../../database/models/post.model';
import { Injectable, Logger } from '@nestjs/common';
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
      throw new LogicException(HTTP_STATUS_ID.APP_POST_SETTING_DISABLE);
    } else if (!(post instanceof PostResponseDto) && !post[action]) {
      throw new LogicException(HTTP_STATUS_ID.APP_POST_SETTING_DISABLE);
    }
  }
}
