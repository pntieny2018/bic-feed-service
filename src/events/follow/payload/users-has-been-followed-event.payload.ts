export class UsersHasBeenFollowedEventPayload {
  public users: {
    userId: string;
    followedGroupIds: string[];
  }[];

  public constructor(data: UsersHasBeenFollowedEventPayload) {
    Object.assign(this, data);
  }
}
