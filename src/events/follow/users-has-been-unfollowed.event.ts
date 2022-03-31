import { IEvent } from '../../common/interfaces';
import { UsersHasBeenUnfollowedEventPayload } from './payload';
import { UsersHasBeenUnFollowed } from '../../common/constants';

export class UsersHasBeenUnfollowedEvent implements IEvent<UsersHasBeenUnfollowedEventPayload> {
  protected static event = UsersHasBeenUnFollowed;

  public payload: UsersHasBeenUnfollowedEventPayload;

  public getEventName(): string {
    return UsersHasBeenUnfollowedEvent.event;
  }

  public constructor(payload: UsersHasBeenUnfollowedEventPayload) {
    this.payload = payload;
  }
}
