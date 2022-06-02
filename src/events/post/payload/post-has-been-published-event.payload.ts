import { ArticleResponseDto } from '../../../modules/article/dto/responses';
import { PostResponseDto } from '../../../modules/post/dto/responses';
import { UserSharedDto } from '../../../shared/user/dto';

export class PostHasBeenPublishedEventPayload {
  public post: PostResponseDto | ArticleResponseDto;
  public actor: UserSharedDto;
}
