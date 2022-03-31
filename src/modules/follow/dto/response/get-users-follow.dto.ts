export class GetUsersFollowDto {
  public limit: number;
  public page: number;
  public userIds: number[];

  public constructor(limit: number, page: number, userIds: number[]) {
    this.limit = limit;
    this.page = page;
    this.userIds = userIds;
  }
}
