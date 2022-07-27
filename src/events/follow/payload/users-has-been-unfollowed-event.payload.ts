export class UsersHasBeenUnfollowedEventPayload {
  public userIds: string[];
  public groupIds: string[];

  public constructor(userIds: string[], groupIds: string[]) {
    this.userIds = userIds;
    this.groupIds = groupIds;
  }
}
