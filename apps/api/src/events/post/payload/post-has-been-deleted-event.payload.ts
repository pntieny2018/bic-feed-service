import { UserDto } from '@libs/service/user';

import { IPost } from '../../../database/models/post.model';

export class PostHasBeenDeletedEventPayload {
  public post: IPost;
  public actor: UserDto;
}
