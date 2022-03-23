import { InjectModel } from '@nestjs/sequelize';
import { IPost, PostModel } from '../../database/models/post.model';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PostAllow } from './post.constants';
import { UserDto } from '../auth';
import { EntityIdDto } from '../../common/dto/entity-id.dto';

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
  public allow(post: IPost, action: PostAllow): void {
    if (!post[action]) {
      throw new BadRequestException(`You can't ${action} this post`);
    }
  }
}
