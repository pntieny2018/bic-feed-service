export class UsersHasBeenFollowedEventPayload {
  public userId: string;
  public followedGroupIds: string[];

  public constructor(data: UsersHasBeenFollowedEventPayload) {
    Object.assign(this, data);
  }
}
