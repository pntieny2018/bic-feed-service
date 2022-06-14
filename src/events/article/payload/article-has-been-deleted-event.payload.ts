import { IPost } from '../../../database/models/post.model';
import { UserSharedDto } from '../../../shared/user/dto';

export class ArticleHasBeenDeletedEventPayload {
  public article: IPost;
  public actor: UserSharedDto;
}
