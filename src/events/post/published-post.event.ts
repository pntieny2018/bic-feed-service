import { AppEvent } from '../event.constant';
export class PublishedPostEvent {
  public static event = AppEvent.POST_PUBLISHED;
  public payload: { postId: number };
  public constructor(postId: number) {
    this.payload = { postId };
  }
}
