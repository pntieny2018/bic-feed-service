import { IPost } from '../../../database/models/post.model';
import { UserSharedDto } from '../../../shared/user/dto';

export class PostHasBeenDeletedEventPayload {
  public post: IPost;
  public actor: UserSharedDto;
}
