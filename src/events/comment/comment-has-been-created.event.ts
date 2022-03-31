import { IEvent } from '../../common/interfaces';
import { CommentHasBeenCreatedEventPayload } from './payload';
import { CommentHasBeenCreated } from '../../common/constants';

export class CommentHasBeenCreatedEvent implements IEvent<CommentHasBeenCreatedEventPayload> {
  protected static event = CommentHasBeenCreated;

  public payload: CommentHasBeenCreatedEventPayload;

  public constructor(payload: CommentHasBeenCreatedEventPayload) {
    Object.assign(this, {
      payload: payload,
    });
  }

  public getEventName(): string {
    return CommentHasBeenCreatedEvent.event;
  }
}
