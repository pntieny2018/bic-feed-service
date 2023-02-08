import { IEvent } from '../../common/interfaces';
import { UsersHasBeenFollowedEventPayload } from './payload';

export class UsersHasBeenFollowedEvent implements IEvent<UsersHasBeenFollowedEventPayload> {
  protected static event = UsersHasBeenFollowedEvent.name;

  public payload: UsersHasBeenFollowedEventPayload;

  public getEventName(): string {
    return UsersHasBeenFollowedEvent.event;
  }

  public constructor(payload: UsersHasBeenFollowedEventPayload) {
    this.payload = payload;
  }
}
