import { IPost } from '../../../database/models/post.model';
import { UserDto } from '../../../modules/v2-user/application';

export class PostHasBeenDeletedEventPayload {
  public post: IPost;
  public actor: UserDto;
}
