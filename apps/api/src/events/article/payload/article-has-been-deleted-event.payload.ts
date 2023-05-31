import { IPost } from '../../../database/models/post.model';
import { UserDto } from '../../../modules/v2-user/application';

export class ArticleHasBeenDeletedEventPayload {
  public article: IPost;
  public actor: UserDto;
}
