import { PostHasBeenUpdated } from '../../common/constants';
import { IEvent } from '../../common/interfaces';
import { PostHasBeenUpdatedEventPayload } from './payload';

export class PostHasBeenUpdatedEvent implements IEvent<PostHasBeenUpdatedEventPayload> {
  protected static event = PostHasBeenUpdated;

  public payload: PostHasBeenUpdatedEventPayload;

  public constructor(payload: PostHasBeenUpdatedEventPayload) {
    Object.assign(this, {
      payload: payload,
    });
  }

  public getEventName(): string {
    return PostHasBeenUpdatedEvent.event;
  }
}
