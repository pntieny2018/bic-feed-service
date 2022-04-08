import { IPost } from '../../database/models/post.model';
import { UserSharedDto } from '../../shared/user/dto';
import { AppEvent } from '../event.constant';
export class DeletedPostEvent {
  public static event = AppEvent.POST_DELETED;
  public payload: IPost;
  public actor: UserSharedDto;
  public constructor(data: IPost, actor: UserSharedDto) {
    this.payload = data;
    this.actor = actor;
  }
}
