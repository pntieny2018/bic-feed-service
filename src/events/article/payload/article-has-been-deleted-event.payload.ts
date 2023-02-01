import { IPost } from '../../../database/models/post.model';
import { UserDto } from '../../../modules/auth';

export class ArticleHasBeenDeletedEventPayload {
  public article: IPost;
  public actor: UserDto;
}
