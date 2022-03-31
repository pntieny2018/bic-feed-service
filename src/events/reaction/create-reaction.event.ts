import { ReactionHasBeenCreated } from '../../common/constants';
import { IEvent } from '../../common/interfaces';
import { CreateReactionEventPayload } from './payload';

export class CreateReactionEvent implements IEvent {
  public static event = ReactionHasBeenCreated;

  public payload: CreateReactionEventPayload;

  public constructor(payload: CreateReactionEventPayload) {
    Object.assign(this, { payload: payload });
  }

  public getEventName(): string {
    return CreateReactionEvent.event;
  }
}
