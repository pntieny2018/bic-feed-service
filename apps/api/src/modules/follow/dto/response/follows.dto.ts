export class FollowsDto {
  public userIds: string[];
  public latestFollowId: number;

  public constructor(userIds: string[], latestFollowId: number) {
    this.userIds = userIds;
    this.latestFollowId = latestFollowId;
  }
}
