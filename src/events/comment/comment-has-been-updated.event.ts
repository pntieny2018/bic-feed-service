import { CommentHasBeenUpdated } from '../../common/constants';
import { IEvent } from '../../common/interfaces';
import { CommentHasBeenUpdatedEventPayload } from './payload';

export class CommentHasBeenUpdatedEvent implements IEvent {
  protected static event = CommentHasBeenUpdated;

  public payload: CommentHasBeenUpdatedEventPayload;

  public constructor(payload: CommentHasBeenUpdatedEventPayload) {
    Object.assign(this, {
      payload: payload,
    });
  }

  public getEventName(): string {
    return CommentHasBeenUpdatedEvent.event;
  }
}
