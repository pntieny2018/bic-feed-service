import { UserDto } from '@libs/service/user';

import { ArticleResponseDto } from '../../../modules/article/dto/responses';
import { PostResponseDto } from '../../../modules/post/dto/responses';

export class PostHasBeenPublishedEventPayload {
  public post: PostResponseDto | ArticleResponseDto;
  public actor: UserDto;
}
