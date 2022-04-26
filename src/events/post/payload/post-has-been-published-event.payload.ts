import { PostResponseDto } from '../../../modules/post/dto/responses';
import { UserSharedDto } from '../../../shared/user/dto';

export class PostHasBeenPublishedEventPayload {
  public post: PostResponseDto;
  public actor: UserSharedDto;
}
