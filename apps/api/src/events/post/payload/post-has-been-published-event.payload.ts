import { ArticleResponseDto } from '../../../modules/article/dto/responses';
import { PostResponseDto } from '../../../modules/post/dto/responses';
import { UserDto } from '../../../modules/v2-user/application';

export class PostHasBeenPublishedEventPayload {
  public post: PostResponseDto | ArticleResponseDto;
  public actor: UserDto;
}
