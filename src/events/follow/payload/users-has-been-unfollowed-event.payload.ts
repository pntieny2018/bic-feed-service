export class UsersHasBeenUnfollowedEventPayload {
  public userIds: number[];
  public groupIds: number[];

  public constructor(userIds: number[], groupIds: number[]) {
    this.userIds = userIds;
    this.groupIds = groupIds;
  }
}
