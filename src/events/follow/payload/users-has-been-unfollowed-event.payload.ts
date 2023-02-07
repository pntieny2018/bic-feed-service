export class UsersHasBeenUnfollowedEventPayload {
  public users: {
    userId: string;
    unfollowedGroupIds: string[];
  }[];

  public constructor(data: UsersHasBeenUnfollowedEventPayload) {
    Object.assign(this, data);
  }
}
