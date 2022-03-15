import { AppEvent } from '../event.constant';
export class DeletedPostEvent {
  public static event = AppEvent.POST_DELETED;
  public payload: {
    postId: number;
  };
  public constructor(postId: number) {
    this.payload = {
      postId,
    };
  }
}
