import { IEvent } from '../../common/interfaces';
import { UsersHasBeenUnfollowedEventPayload } from './payload';

export class UsersHasBeenUnfollowedEvent implements IEvent<UsersHasBeenUnfollowedEventPayload> {
  protected static event = UsersHasBeenUnfollowedEvent.name;

  public payload: UsersHasBeenUnfollowedEventPayload;

  public getEventName(): string {
    return UsersHasBeenUnfollowedEvent.event;
  }

  public constructor(payload: UsersHasBeenUnfollowedEventPayload) {
    this.payload = payload;
  }
}
