import { IPost } from '../../database/models/post.model';
import { AppEvent } from '../event.constant';
export class DeletedPostEvent {
  public static event = AppEvent.POST_DELETED;
  public payload: IPost;
  public constructor(data: IPost) {
    Object.assign(this, { payload: data });
  }
}
