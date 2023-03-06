import { PostResponseDto } from '../../../modules/post/dto/responses';
import { UserDto } from '../../../modules/v2-user/application';

export class PostHasBeenUpdatedEventPayload {
  public oldPost: PostResponseDto;
  public newPost: PostResponseDto;
  public actor: UserDto;
}
