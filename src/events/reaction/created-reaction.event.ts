import { ReactionHasBeenCreated } from '../../common/constants';
import { IEvent } from '../../common/interfaces';
import { CreatedReactionEventPayload } from './payload';

export class CreatedReactionEvent implements IEvent {
  public static event = ReactionHasBeenCreated;

  public payload: CreatedReactionEventPayload;

  public constructor(payload: CreatedReactionEventPayload) {
    Object.assign(this, { payload: payload });
  }

  public getEventName(): string {
    return CreatedReactionEvent.event;
  }
}
