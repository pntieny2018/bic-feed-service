import { IPost } from '../../../database/models/post.model';
import { UserSharedDto } from '../../../shared/user/dto';

export class SeriesHasBeenDeletedEventPayload {
  public series: IPost;
  public actor: UserSharedDto;
}
