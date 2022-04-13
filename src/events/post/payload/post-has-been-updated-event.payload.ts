import { PostResponseDto } from '../../../modules/post/dto/responses';
import { UserSharedDto } from '../../../shared/user/dto';

export class PostHasBeenUpdatedEventPayload {
  public oldPost: PostResponseDto;
  public newPost: PostResponseDto;
  public actor: UserSharedDto;
}
