import { PostHasBeenPublished } from '../../common/constants';
import { IEvent } from '../../common/interfaces';
import { PostHasBeenPublishedEventPayload } from './payload';

export class PostHasBeenPublishedEvent implements IEvent<PostHasBeenPublishedEventPayload> {
  protected static event = PostHasBeenPublished;

  public payload: PostHasBeenPublishedEventPayload;

  public constructor(payload: PostHasBeenPublishedEventPayload) {
    Object.assign(this, {
      payload: payload,
    });
  }

  public getEventName(): string {
    return PostHasBeenPublishedEvent.event;
  }
}
