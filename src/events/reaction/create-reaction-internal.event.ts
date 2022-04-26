import { ReactionHasBeenCreated } from '../../common/constants';
import { IEvent } from '../../common/interfaces';
import { CreateReactionEventInternalPayload } from './payload';

export class CreateReactionInternalEvent implements IEvent<CreateReactionEventInternalPayload> {
  public static event = ReactionHasBeenCreated;

  public payload: CreateReactionEventInternalPayload;

  public constructor(payload: CreateReactionEventInternalPayload) {
    Object.assign(this, { payload: payload });
  }

  public getEventName(): string {
    return CreateReactionInternalEvent.event;
  }
}
