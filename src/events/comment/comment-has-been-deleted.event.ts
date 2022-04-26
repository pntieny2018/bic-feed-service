import { CommentHasBeenDeleted } from '../../common/constants';
import { IEvent } from '../../common/interfaces';
import { CommentHasBeenDeletedEventPayload } from './payload';

export class CommentHasBeenDeletedEvent implements IEvent<CommentHasBeenDeletedEventPayload> {
  protected static event = CommentHasBeenDeleted;

  public payload: CommentHasBeenDeletedEventPayload;

  public constructor(payload: CommentHasBeenDeletedEventPayload) {
    Object.assign(this, {
      payload: payload,
    });
  }

  public getEventName(): string {
    return CommentHasBeenDeletedEvent.event;
  }
}
