import { UserDto } from 'src/modules/auth';
import { AppEvent } from '../event.constant';
export class PublishedDraftPostEventPayload {
  public user: UserDto;
  public postId: number;
}
export class PublishedPostEvent {
  public static event = AppEvent.POST_PUBLISHED;
  public payload: PublishedDraftPostEventPayload;
  public constructor(user: UserDto, postId: number) {
    this.payload = {
      user,
      postId,
    };
  }
}
