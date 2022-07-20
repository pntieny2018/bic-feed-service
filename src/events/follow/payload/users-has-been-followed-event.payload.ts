export class UsersHasBeenFollowedEventPayload {
  public userIds: string[];
  public groupIds: string[];

  public constructor(userIds: string[], groupIds: string[]) {
    this.userIds = userIds;
    this.groupIds = groupIds;
  }
}
