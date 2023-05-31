import { PostHasBeenDeleted } from '../../common/constants';
import { IEvent } from '../../common/interfaces';
import { PostHasBeenDeletedEventPayload } from './payload';

export class PostHasBeenDeletedEvent implements IEvent<PostHasBeenDeletedEventPayload> {
  protected static event = PostHasBeenDeleted;

  public payload: PostHasBeenDeletedEventPayload;

  public constructor(payload: PostHasBeenDeletedEventPayload) {
    Object.assign(this, {
      payload: payload,
    });
  }

  public getEventName(): string {
    return PostHasBeenDeletedEvent.event;
  }
}
