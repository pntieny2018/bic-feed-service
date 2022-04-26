import { IEvent } from '../../common/interfaces';
import { UsersHasBeenFollowedEventPayload } from './payload';
import { UsersHasBeenFollowed } from '../../common/constants';

export class UsersHasBeenFollowedEvent implements IEvent<UsersHasBeenFollowedEventPayload> {
  protected static event = UsersHasBeenFollowed;

  public payload: UsersHasBeenFollowedEventPayload;

  public getEventName(): string {
    return UsersHasBeenFollowedEvent.event;
  }

  public constructor(payload: UsersHasBeenFollowedEventPayload) {
    this.payload = payload;
  }
}
