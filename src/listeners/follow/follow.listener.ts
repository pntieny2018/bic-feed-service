import { Injectable, Logger } from '@nestjs/common';
import { On } from '../../common/decorators';
import { UsersHasBeenFollowedEvent, UsersHasBeenUnfollowedEvent } from '../../events/follow';

@Injectable()
export class FollowListener {
  private readonly _logger = new Logger(FollowListener.name);

  public constructor(private _) {}
  @On(UsersHasBeenFollowedEvent)
  public async onUsersFollowGroups(event: UsersHasBeenFollowedEvent) {
    const { payload } = event;
  }

  @On(UsersHasBeenUnfollowedEvent)
  public async onUsersUnFollowGroup(event: UsersHasBeenUnfollowedEvent) {
    const { payload } = event;
  }
}
