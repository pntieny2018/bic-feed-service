export class UsersHasBeenUnfollowedEventPayload {
  public userId: string;
  public unfollowedGroupIds: string[];

  public constructor(data: UsersHasBeenUnfollowedEventPayload) {
    Object.assign(this, data);
  }
}
