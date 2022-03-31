export class UsersHasBeenUnfollowedEventPayload {
  public userIds: number[];
  public groupId: number;

  public constructor(userIds: number[], groupId: number) {
    this.userIds = userIds;
    this.groupId = groupId;
  }
}
