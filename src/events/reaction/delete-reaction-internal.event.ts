import { ReactionHasBeenRemoved } from '../../common/constants';
import { IEvent } from '../../common/interfaces';
import { DeleteReactionEventInternalPayload } from './payload';

export class DeleteReactionInternalEvent implements IEvent<DeleteReactionEventInternalPayload> {
  public static event = ReactionHasBeenRemoved;

  public payload: DeleteReactionEventInternalPayload;

  public constructor(payload: DeleteReactionEventInternalPayload) {
    Object.assign(this, { payload: payload });
  }

  public getEventName(): string {
    return DeleteReactionInternalEvent.event;
  }
}
