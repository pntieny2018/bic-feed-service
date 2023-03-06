import { IPost } from '../../../database/models/post.model';
import { UserDto } from '../../../modules/v2-user/application';

export class SeriesHasBeenDeletedEventPayload {
  public series: IPost;
  public actor: UserDto;
}
