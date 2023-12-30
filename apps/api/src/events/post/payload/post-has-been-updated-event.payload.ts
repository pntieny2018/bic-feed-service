import { UserDto } from '@libs/service/user';

import { PostResponseDto } from '../../../modules/post/dto/responses';

export class PostHasBeenUpdatedEventPayload {
  public oldPost: PostResponseDto;
  public newPost: PostResponseDto;
  public actor: UserDto;
}
